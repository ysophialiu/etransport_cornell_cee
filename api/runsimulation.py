import numpy as np
import pandas as pd
import geopandas as gpd
import time
from evtripchain import *
from behavior import *
from demandsim import *
from resultplots import *

def simulate(EV_sample, trip_sample, pbetaSOC, pbetaR, pSOCB, pShares):
  # start_time = time.time()
  # define EV penetration rate (x %)
  # rrate = 0.1
  # p_rate = rrate/100

  # define zone name
  zzones =  'MTAZ10' #'TRACT10' #'SD10'

  ## CALL GEOGRAPHIC DATA, SAVED TRIPS, En, Cn, INITIAL SOC OF EVs
  EV_trip, EV_N_trips = make_EV_trips(EV_sample, trip_sample)
  SOC_int = make_SOC_init(EV_sample)

  # BEV groups parameters & market share:
  # electric capacity (kWh)
  # Reference: Tesla (60-100kWh); Nissan Leaf (40-60kWh)
  En = {0:60, 1:100, 2:100} #{0:40, 1:100, 2:100}
  # energy consumption rate (kWh/mile)
  # Reference: Tesla (0.33-0.38kwh/mi); Audi (0.43kWh/mi)
  cn = {0:0.3, 1:0.3, 2:0.35} 
  # market share (probability distribution of each En value)
  prob_En = pShares #[0.3,0.6,0.1]
  print('market shares: ', prob_En)
  En_v, cn_v = make_En_cn(EV_sample, En, cn, prob_En)

  # call geography data
  shapefile = gpd.read_file("map/Model_Traffic_Analysis_Zones_2020.shp")
  Num_zone = len(shapefile[zzones].unique())
  print('number of zones: ', Num_zone)
  zone_array = np.sort(shapefile[zzones].unique()).tolist()
  shapefile['new_zone_name'] = [zone_array.index(x)+1 for x in shapefile[zzones]]
  # print('EV_trip (in time order): end_period 1.0-48.0+, 1 = 3:00-3:30, delta 1=30min;d-taz:1-5922; distance in mile;  dwell_time: in hour')

  # change trip zone resolution
  join_zones = pd.DataFrame(shapefile[['OBJECTID','new_zone_name']]).set_index('OBJECTID')
  EV_trip = EV_trip.join(join_zones, on="d_taz")
  EV_trip['d_taz']=EV_trip['new_zone_name']
  EV_trip = EV_trip.drop(columns =['new_zone_name'])

  ## DEFINE CHARGING BEHAVIOR CASE
  charge_behave = 'base'
  #'base' 'low_risk_sensitive' 'high_risk_sensitive'
  #'prefer_fast_charge' 'dislike_fast_charge'
  ###################################
  #'high_cost_sensitive' #'low_range_buffer'

  # beta_SOC,beta_R,beta_delta_SOC,beta_0,beta_cost,beta_SOC_0,lbd
  # behavior_params = charging_behavior_parameter(charge_behave)
  behavior_params = [pbetaSOC, pbetaR, 2, 1, 0.1, pSOCB, 1]
  print("behavior_params: ", behavior_params)

  ## DEFINE SIMULATION INPUT: CHARGING MODES, CHARGING NUMBER/TAZ, PUBLIC CHARGING PRICE

  # define charging rate kw for level 1,2,3
  # Reference: SAE J 1772 charging specification
  # level 1: 120 volt (V) AC charge. 1.4-1.9kW
  # level 2: 240 volt (V) AC charge. 3.7-6.6-19.2kW
  # level 3: 480 volt (V) DC charge. 24-36-90-240 kW
  rate = np.array([3.6,6.2,150]) # kW
  rate_name = ['h2','l2','l3']
  location_name = ['home','work','public']

  # define price $/kwh for level 1,2,3
  # NREL: 0.11$/kWh  https://afdc.energy.gov/fuels/electricity_charging_home.html
  home_price = 0.13
  # public charging price
  pub_price = 0.43 #1.2*home_price

  # Simulate D days, D>1
  D = 6 #2 #20

  # Charging available
  # L_available = [0,1,1] #[1,0,0]

  # define number of type i charger per zone, public charging price
  dim = (2*Num_zone)  # dimension of variables
  # generate random number of stations
  # ci_z = np.random.randint(low=-1,high=1, size=dim)#.astype('float64')
  ci_z = np.random.randint(low=0,high=10, size=dim) # number of chargers (later, add as an input)

  # print('charging rate (kW) [home L2, non_home L2, non_home DCFC]:', rate)
  # print('home charging price ($):', home_price, '; public charging price ($): ', pub_price)
  # print('simulation days:', D)  
  # print('available charging type (home, non-home L2, non_home DCFC):', L_available)
  # print("dimension of variables:",dim)
  print("ci_z:", ci_z)

  # test_En = 60 #250 #100 # 60
  # wait_time = np.array([0.2,0.5,1,5,20]) #([0.2,0.5,1,2,3,5,6,7,10])
  # SOC_test = np.arange(0, 1.1, 0.1)
  # <plots>
  # test_En = 100 #250 #100 # 60
  # print('total energy of EV (kWh):',test_En)
  # wait_time = np.array([0.2,0.5,1,5,20]) #([0.2,0.5,1,2,3,5,6,7,10])
  # SOC_test = np.arange(0, 1.1, 0.1)
  # <plots>
  
  fail_EV, E_taz_r, result, ciz_t = sim_demand(ci_z, EV_sample, EV_trip, EV_N_trips, SOC_int, En_v, cn_v, shapefile, behavior_params, rate, rate_name, location_name, home_price, pub_price, D, Num_zone)
  # b = sim_demand_faster(ci_z, EV_sample, EV_trip, EV_N_trips, SOC_int, En_v, cn_v, shapefile, behavior_params, rate, rate_name, location_name, home_price, pub_price, D, Num_zone)

  # total_elapsed = time.time() - start_time
  # print("--- %s seconds ---" % (total_elapsed))

  # fail list and fail rate
  fail_list = fail_EV
  print('fail rate:',len(fail_list)/len(EV_sample))

  # individual 
  ind_res = pd.DataFrame.from_dict({(i,j,k): result[i][j][k]
                            for i in result.keys() 
                            for j in result[i].keys()
                            for k in result[i][j].keys()},
                        orient='index')
  ind_res.reset_index(inplace=True)  
  ind_res = ind_res.rename(columns={"level_0": "day", "level_1": "N.EV", "level_2": "N.trip"})
  ind_res['TAZ'] = ind_res['charge_TAZ']
  ind_use = ind_res[['day','TAZ','charge_energy']].dropna()
  ind_use = ind_use.groupby(by=["day","TAZ"]).sum()
  ind_res = ind_res[~ind_res['N.EV'].isin(fail_list)]
  # check data format
  print(ind_res[0:5])

  # demand per TAZ per charger type
  E_taz = pd.DataFrame.from_dict({(i,j,k): E_taz_r[i][j][k]
                            for i in E_taz_r.keys() 
                            for j in E_taz_r[i].keys()
                            for k in E_taz_r[i][j].keys()},
                        orient='index')
  E_taz.reset_index(inplace=True)  
  E_taz = E_taz.rename(columns={"level_0": "day", "level_1": "TAZ", "level_2": "charger type"})
  E_taz['total energy'] = E_taz['home']+E_taz['work']+E_taz['public']

  # demand per TAZ on last day
  E_use = E_taz.loc[E_taz['day'] == (D-1)].drop(columns=['day', 'home', 'work', 'public']).groupby(by='TAZ').sum()
  # show format 
  print(E_taz[0:5])
  print(E_use) 

  E_use_h2 = E_taz.loc[(E_taz['day'] == (D-1)) & (E_taz['charger type'] == 'h2')].drop(columns=['day', 'home', 'work', 'public']).groupby(by='TAZ').sum()
  E_use_l2 = E_taz.loc[(E_taz['day'] == (D-1)) & (E_taz['charger type'] == 'l2')].drop(columns=['day', 'home', 'work', 'public']).groupby(by='TAZ').sum()
  E_use_l3 = E_taz.loc[(E_taz['day'] == (D-1)) & (E_taz['charger type'] == 'l3')].drop(columns=['day', 'home', 'work', 'public']).groupby(by='TAZ').sum()
  
  labels, sizes, L_type = f(ind_res, E_taz, trip_sample)

  return ind_res, E_taz, E_use, labels, sizes, L_type, E_use_h2, E_use_l2, E_use_l3
