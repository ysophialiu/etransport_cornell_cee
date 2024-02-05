import pickle
import pandas as pd
from matplotlib.pyplot import figure
import matplotlib as mpl

import geopandas as gpd
import time
from evtripchain import *
from behavior import *
from demandsim import *
from resultplots import *
import numpy as np
from scipy.stats import truncnorm
from matplotlib.ticker import EngFormatter
from operator import add

def simulateNew(dayT, state, pbetaSOC, pbetaR, pSOCB, homeP, publicP, L2_V, DCFC_V, NOV_V):
    state_fips = STATEFIPS[state]
    state = state_to_abbreviation(state)

    zzones = 'MTFCC'  # 'TRACT10' #'SD10'
    shapefile = gpd.read_file("census/tl_2015_%s_tract/tl_2015_%s_tract.shp" % (state_fips, state_fips))
    Num_zone = len(shapefile[zzones].unique())
    zone_array = np.sort(shapefile[zzones].unique()).tolist()
    shapefile['new_zone_name'] = [zone_array.index(x) + 1 for x in shapefile[zzones]]

    rate = np.array([3.6, 6.2, 150])  # kW  [3.6,6.2,150]
    rate_name = ['h2', 'l2', 'l3']
    location_name = ['home', 'work', 'public']
    behavior_params = [pbetaSOC, pbetaR, 2, 1, 0.1, pSOCB, 1]
    home_price = homeP

    week_day = dayT

    EV_trip = pickle.load(open('vtrip/%s_EV_trip_%s.p' % (state,week_day), "rb"))

    EV_N_trips = EV_trip['EV_list'].value_counts()
    EV_sample = list(EV_trip['EV_list'].unique())

    print('This is for %s trips' % week_day)
    print('number of trips:', len(EV_trip))
    print('number of vehicles:', len(EV_sample))
    print('This is how the data look like:')
    EV_trip[0:5]

    # small data state: D=6
    # large data state: D=3

    if len(EV_sample) > 3000:
        D = 3
    else:
        D = 6

    # assign encode_number for d_taz
    zone_code = list(sorted(EV_trip['d_taz'].unique()))
    Num_zone = len(zone_code)
    zone_array = list(range(1, len(zone_code) + 1))
    dic_zone = dict(zip(zone_code, zone_array))
    dic_zone2 = dict(zip(zone_array, zone_code))
    # replace location as zone code
    EV_trip['d_taz'] = [dic_zone[i] for i in EV_trip['d_taz']]

    EV_trip[EV_trip['EV_list'] == '300113283']

    charge_behave = 'base'

    beta_SOC, beta_R, beta_delta_SOC, beta_0, beta_cost, beta_SOC_0, lbd = charging_behavior_parameter(charge_behave)
    print('These are parameters in the charging choice model')

    En = {0: 60, 1: 100, 2: 100}

    # define energy consumption rate: kWh/mile  (Suggest not change)
    # Reference: Tesla (0.33-0.38kwh/mi)
    cn = {0: 0.3, 1: 0.3, 2: 0.35}

    # define probability distriburion of each En value
    prob_En = [0.3, 0.6, 0.1]
    # generate distribution
    Snr = [0, 1, 2]  # list used in the dictionary
    # list of En and Cn
    Scenario = np.random.choice(Snr, len(EV_sample), p=prob_En)
    # create En Cn for the EV list

    En_v = [En.get(n) for n in Scenario]
    cn_v = [cn.get(n) for n in Scenario]
    En_v = dict(zip(EV_sample, En_v))
    cn_v = dict(zip(EV_sample, cn_v))

    def Init_SOC(cases):
        # mean,sd, low, upp
        parameter_list = [[0.7324919595528574, 0.14222975174228758, 0.22067026978914075, 1.0],
                          [0.5734890448698912, 0.15712310015212297, 0.20243999999999995, 1.0],
                          [0.8276271161103358, 0.12204207789138573, 0.2041829411620677, 1.0],
                          [0.7477273429502866, 0.14006812858346473, 0.20587000000000003, 1.0],
                          [0.7207728408826842, 0.14543499457298006, 0.20671258988867014, 1.0],
                          [0.7029625189454968, 0.15211267134712808, 0.11100674272163669, 1.0],
                          [0.6297560710721821, 0.17206166873501583, 0.18099748205730337, 1.0]]

        if cases == 'base':
            res = parameter_list[0]
        if cases == 'low_risk_sensitive':
            res = parameter_list[1]
        if cases == 'high_risk_sensitive':
            res = parameter_list[2]
        if cases == 'prefer_fast_charge':
            res = parameter_list[3]
        if cases == 'dislike_fast_charge':
            res = parameter_list[4]
        if cases == 'high_cost_sensitive':
            res = parameter_list[5]
        if cases == 'low_range_buffer':
            res = parameter_list[6]
        return res

    def get_truncated_normal(mean, sd, low, upp):  # (mean, sd, low, upp):
        # mean = low + (upp-low)/2
        return truncnorm(
            (low - mean) / sd, (upp - mean) / sd, loc=mean, scale=sd)


    mean, sd, low, upp = Init_SOC(charge_behave)
    # sample initial SOC for the EV list
    SOC_int = get_truncated_normal(mean, sd, low, upp).rvs(size=len(EV_sample))

    # draw sampled initial SOC
    print('Initial SOC distribution')
    SOC_int = dict(zip(EV_sample, SOC_int))


    pickle.dump(SOC_int, open('Result/initial_SOC_%s_%s.p' % (week_day, charge_behave), "wb"))  # save data

    pub_price = publicP

    # define simulation days
    #D = 10  # simulate D days, D>=1. compute time: D = 2 ~ 160s, D = 6 ~ 400s
    print('public charging price $:', pub_price)
    print('Simulation day:', D)
    # define number of type i charger per zone, public charging price
    dim = (2 * Num_zone)  # dimension of variables

    # generate random number of stations
    c_i_z = np.random.randint(low=10000, high=10001, size=dim)

    compute_time = time.time()

    # a: raw simulated data
    if L2_V != 1 or DCFC_V != 1:
        print("AVAI")
        a = sim_demandAVAI(c_i_z, EV_sample, EV_trip, EV_N_trips, SOC_int, En_v, cn_v, shapefile, behavior_params, rate, rate_name, location_name, home_price, pub_price, D, Num_zone, L2_V, DCFC_V)
    else:
        print("NEW")
        a = sim_demandNEW(c_i_z, EV_sample, EV_trip, EV_N_trips, SOC_int, En_v, cn_v, shapefile, behavior_params, rate, rate_name, location_name, home_price, pub_price, D, Num_zone)
    print("--- %s seconds ---" % (time.time() - compute_time))

    #print(a)
    ### Results
    # fail list and fail rate
    fail_list = a[0]

    # save data
    pickle.dump(fail_list, open('Result/failed_EV_%s_%s.p' % (week_day, charge_behave), "wb"))  # save data

    print('number of failed of charging EV:', len(fail_list))
    print('fail rate:', len(fail_list) / len(EV_sample))
    # individual EV charging demand
    ind_res = pd.DataFrame.from_dict({(i, j, k): a[2][i][j][k]
                                      for i in a[2].keys()
                                      for j in a[2][i].keys()
                                      for k in a[2][i][j].keys()},
                                     orient='index')
    ind_res.reset_index(inplace=True)
    ind_res = ind_res.rename(columns={"level_0": "day", "level_1": "N.EV", "level_2": "N.trip"})
    ind_res['TAZ'] = ind_res['charge_TAZ']
    ind_res = ind_res[~ind_res['N.EV'].isin(fail_list)]
    ind_res['des_category'] = ind_res['TAZ'].map(dic_zone2)
    ind_use = ind_res[['day', 'N.EV', 'N.trip', 'SOC_s', 'SOC_e', 'rate', 'charge_start_period', 'charge_end_period', 'TAZ',
                       'des_category', 'charge_energy', 'd_purpose']].dropna()
    ind_use = ind_use[ind_use['rate'] != 0]

    ind_use['charge_start_period'] = ind_use['charge_start_period'] + ind_use['day'] * 48
    ind_use['charge_end_period'] = ind_use['charge_end_period'] + ind_use['day'] * 48
    print('This is individual EV data')
    ind_use.head(5)
    ##  <span style='background :yellow' > save individual demand
    # Save individual demand
    pickle.dump(ind_use, open('Result/Individual_charging_%s_%s.p' % (week_day, charge_behave), "wb"))  # save data

    ind_use.to_excel('Result/Individual_charging_data.xlsx', sheet_name='charging_event', index=False)

    # demand per TAZ per charger type
    E_taz = pd.DataFrame.from_dict({(i, j, k): a[1][i][j][k]
                                    for i in a[1].keys()
                                    for j in a[1][i].keys()
                                    for k in a[1][i][j].keys()},
                                   orient='index')
    E_taz.reset_index(inplace=True)
    E_taz = E_taz.rename(columns={"level_0": "day", "level_1": "TAZ", "level_2": "charger type"})
    E_taz['total energy'] = E_taz['home'] + E_taz['work'] + E_taz['public']

    # demand
    print(E_taz[0:5])
    #print(E_use)

    E_use_h2 = E_taz.loc[ (E_taz['charger type'] == 'h2')]
    E_use_l2 = E_taz.loc[ (E_taz['charger type'] == 'l2')]
    E_use_l3 = E_taz.loc[ (E_taz['charger type'] == 'l3')]

    public_l2_Sum = sum(E_use_l2["public"])
    public_DCFC_Sum = sum(E_use_l3["public"])

    work_l2_Sum = sum(E_use_l2["work"])
    work_DCFC_Sum = sum(E_use_l3["work"])

    p_tempSum = public_DCFC_Sum + public_l2_Sum
    if p_tempSum == 0:
        p_tempSum = 1

    publicL2Rate = public_l2_Sum/p_tempSum

    # Regional charging demand
    t_step = 1

    w_tempSum = work_DCFC_Sum + work_l2_Sum
    if w_tempSum == 0:
        w_tempSum = 1

    workL2Rate = work_l2_Sum/w_tempSum

    power_demand = {}  # define charge power

    for i in zone_array:
        power_demand[i] = {}
        for t in np.arange(1, 48 * D, t_step):
            power_demand[i][round(t, 2)] = 0

    tep_demand = {}  # reigional temporal demand

    loc = ['Home', 'Work', 'Public']
    for i in loc:
        tep_demand[i] = {}
        for t in np.arange(1, 48 * D, t_step):
            tep_demand[i][round(t, 2)] = 0

    compute_time = time.time()

    for index, row in ind_use.iterrows():
        rt = row['rate']
        tazz = row['TAZ']
        lc = row['d_purpose']
        a_time = row['charge_start_period']
        b_time = row['charge_end_period']

        for t in np.arange(1, 48 * D, t_step):
            t = round(t, 2)
            if t >= a_time and t <= b_time:
                power_demand[tazz][t] += rt
                tep_demand[lc][t] += rt
            if t > b_time:
                break

    print("--- %s seconds ---" % (time.time() - compute_time))

    power_res = pd.DataFrame.from_dict(power_demand, orient='index', )
    power_res.reset_index(inplace=True)
    power_res = power_res.rename(columns={"index": "des_category"})
    power_res['des_category'] = power_res['des_category'].map(dic_zone2)
    print('This is demand by region category')
    power_res.head(5)
    ##  <span style='background :yellow' > save regional demand
    # Save regional demand
    pickle.dump(power_res, open('Result/Regional_charging_%s_%s.p' % (week_day, charge_behave), "wb"))  # save data

    ind_use.to_excel('Result/Regional_charging_data.xlsx', sheet_name='charging_event', index=False)
    ## check census match
    census = pickle.load(open('census/%s_census.pkl' % state_fips, "rb"))
    numtracts_by_category = census.groupby('category')['GEOID'].nunique()
    geoid_by_category = census.groupby('category')['GEOID'].apply(list)
    #print(geoid_by_category)
    A = set(power_res['des_category'])
    B = set(census['category'])

    cnt = 0
    for i in EV_trip['d_taz'].map(dic_zone2):
        if i not in B:
            cnt += 1

    print("There are %s percent of trips cannot find matching category" % round((100 * cnt / len(EV_trip)), 2))

    print("There are {} categories in total, {} categories don't have data".format(len(A), len(B - A)))

    # only need demand per hour
    bus = pickle.load(open("vtrip/bus_assign.pkl", "rb"))
    bus_power = {}
    for i in bus:
        bus_power[i] = []

    fail_list = a[0]

    # individual EV charging demand
    ind_res = pd.DataFrame.from_dict({(i, j, k): a[2][i][j][k]
                                      for i in a[2].keys()
                                      for j in a[2][i].keys()
                                      for k in a[2][i][j].keys()},
                                     orient='index')
    ind_res.reset_index(inplace=True)
    ind_res = ind_res.rename(columns={"level_0": "day", "level_1": "N.EV", "level_2": "N.trip"})
    ind_res['TAZ'] = ind_res['charge_TAZ']
    ind_res = ind_res[~ind_res['N.EV'].isin(fail_list)]
    ind_res['des_category'] = ind_res['TAZ'].map(dic_zone2)
    ind_use = ind_res[
        ['day', 'N.EV', 'N.trip', 'SOC_s', 'SOC_e', 'rate', 'charge_start_period', 'charge_end_period', 'TAZ',
         'des_category', 'charge_energy', 'd_purpose']].dropna()
    ind_use = ind_use[ind_use['rate'] != 0]

    ind_use['charge_start_period'] = ind_use['charge_start_period'] + ind_use['day'] * 48
    ind_use['charge_end_period'] = ind_use['charge_end_period'] + ind_use['day'] * 48
    # print(ind_use)

    # Regional charging demand
    t_step = 1

    power_demand = {}  # define charge power

    charge_by_geoid = {}

    charge_scale = NOV_V/len(EV_sample)

    for i in zone_array:
        power_demand[i] = {}
        for t in np.arange(1, 48 * D + 1, t_step):
            power_demand[i][round(t, 2)] = 0

    for index, row in ind_use.iterrows():
        rt = row['rate']
        tazz = row['TAZ']

        category = row['des_category']

        geoids = geoid_by_category[category] if category in geoid_by_category else []
        category_share = len(geoids)

        a_time = row['charge_start_period']
        b_time = row['charge_end_period']
        for geoid in geoids:
            if geoid in charge_by_geoid:
                charge_by_geoid[geoid]['demand'] += (row['charge_energy'] / category_share) * charge_scale
            else:
                charge_by_geoid[geoid] = {'demand': (row['charge_energy'] / category_share) * charge_scale,
                                          'tract': census.loc[census['GEOID'] == geoid]['tract'].iloc[0],
                                          'county': census.loc[census['GEOID'] == geoid]['county'].iloc[0],
                                          'state': state}

        for t in np.arange(1, 48 * D + 1, t_step):
            t = round(t, 2)
            if t >= a_time and t <= b_time:
                power_demand[tazz][t] += rt
            if t > b_time:
                break

    # print(power_demand)

    power_res = pd.DataFrame.from_dict(power_demand, orient='index')
    power_res.reset_index(inplace=True)
    power_res = power_res.drop(columns=[i for i in range(1, 49)])
    power_res.columns = ['des_category'] + [i for i in range(1, 48 * (D - 1) + 1)]

    # Compute demand per hour
    computed_values = {}
    for i in range(0, 24 * (D - 1)):
        computed_values[i] = round((power_res[i * 2 + 1] + power_res[i * 2 + 2]) / 2, 2)

    # Create res DataFrame
    res = pd.DataFrame(power_res['des_category'].map(dic_zone2))
    res = pd.concat([res, pd.DataFrame(computed_values)], axis=1)

    res_demand = res.set_index('des_category').T.to_dict('list')  # convert to dict

    # assign regional demand to bus
    for i in bus:
        bus_i_lst = [0] * len(range(0, 24 * (D - 1)))
        for (a, b, c) in bus[i]:
            if (a, b, c) not in res_demand:
                continue
            fraction = bus[i][(a, b, c)]
            bus_i_lst = list(map(add, bus_i_lst, [fraction * j for j in res_demand[(a, b, c)]]))
        bus_power[i].append(bus_i_lst)

    print("-------")
    return tep_demand, power_demand, bus_power, publicL2Rate, workL2Rate, charge_by_geoid

def getOverview(dayType, state, nov_V):
    print(dayType)
    state = state_to_abbreviation(state)
    print(state)
    zzones = 'MTFCC'  # 'TRACT10' #'SD10'
    shapefile = gpd.read_file("map/tl_2015_36_tract.shp")
    print(shapefile.columns)
    Num_zone = len(shapefile[zzones].unique())
    print('number of zones: ', Num_zone)
    zone_array = np.sort(shapefile[zzones].unique()).tolist()
    shapefile['new_zone_name'] = [zone_array.index(x) + 1 for x in shapefile[zzones]]

    week_day = dayType

    EV_trip = pickle.load(open('vtrip/%s_EV_trip_%s.p' % (state,week_day), "rb"))
    EV_N_trips = EV_trip['EV_list'].value_counts()
    EV_sample = list(EV_trip['EV_list'].unique())
    oldNumV = len(EV_sample)
    oldTrip = len(EV_trip)
    newNumV = oldNumV
    newTrip = oldTrip
    print('This is for %s trips' % week_day)
    print('number of trips:', len(EV_trip))
    print('number of vehicles:', len(EV_sample))
    print('This is how the data look like:')
    EV_trip[0:5]
    # assign encode_number for d_taz
    zone_code = list(sorted(EV_trip['d_taz'].unique()))
    Num_zone = len(zone_code)
    zone_array = list(range(1, len(zone_code) + 1))
    dic_zone = dict(zip(zone_code, zone_array))
    dic_zone2 = dict(zip(zone_array, zone_code))
    # replace location as zone code
    EV_trip['d_taz'] = [dic_zone[i] for i in EV_trip['d_taz']]

    EV_trip[EV_trip['EV_list'] == '300113283']

    chain_length = EV_N_trips

    EV = EV_trip
    average_distance = EV_trip['distance'].mean().round(2)

    rate = nov_V/oldNumV
    # oldTrip = oldTrip * rate
    # oldNumV = nov_V

    print(EV_trip['start_period'])

    return EV, rate ,oldNumV, oldTrip, newNumV, newTrip, average_distance,chain_length, EV_trip['start_period'], EV_trip['distance']

def state_to_abbreviation(state_name):
    states = {
        'Alabama': 'AL',
        'Alaska': 'AK',
        'Arizona': 'AZ',
        'Arkansas': 'AR',
        'California': 'CA',
        'Colorado': 'CO',
        'Connecticut': 'CT',
        'Delaware': 'DE',
        'Florida': 'FL',
        'Georgia': 'GA',
        'Hawaii': 'HI',
        'Idaho': 'ID',
        'Illinois': 'IL',
        'Indiana': 'IN',
        'Iowa': 'IA',
        'Kansas': 'KS',
        'Kentucky': 'KY',
        'Louisiana': 'LA',
        'Maine': 'ME',
        'Maryland': 'MD',
        'Massachusetts': 'MA',
        'Michigan': 'MI',
        'Minnesota': 'MN',
        'Mississippi': 'MS',
        'Missouri': 'MO',
        'Montana': 'MT',
        'Nebraska': 'NE',
        'Nevada': 'NV',
        'NewHampshire': 'NH',
        'NewJersey': 'NJ',
        'NewMexico': 'NM',
        'NewYork': 'NY',
        'NorthCarolina': 'NC',
        'NorthDakota': 'ND',
        'Ohio': 'OH',
        'Oklahoma': 'OK',
        'Oregon': 'OR',
        'Pennsylvania': 'PA',
        'RhodeIsland': 'RI',
        'SouthCarolina': 'SC',
        'SouthDakota': 'SD',
        'Tennessee': 'TN',
        'Texas': 'TX',
        'Utah': 'UT',
        'Vermont': 'VT',
        'Virginia': 'VA',
        'Washington': 'WA',
        'WestVirginia': 'WV',
        'Wisconsin': 'WI',
        'Wyoming': 'WY'
    }

    return states.get(state_name)

STATEFIPS = {
    'Alabama': '01',
    'Alaska': '02',
    'Arizona': '04',
    'Arkansas': '05',
    'California': '06',
    'Colorado': '08',
    'Connecticut': '09',
    'Delaware': '10',
    'Florida': '12',
    'Georgia': '13',
    'Hawaii': '15',
    'Idaho': '16',
    'Illinois': '17',
    'Indiana': '18',
    'Iowa': '19',
    'Kansas': '20',
    'Kentucky': '21',
    'Louisiana': '22',
    'Maine': '23',
    'Maryland': '24',
    'Massachusetts': '25',
    'Michigan': '26',
    'Minnesota': '27',
    'Mississippi': '28',
    'Missouri': '29',
    'Montana': '30',
    'Nebraska': '31',
    'Nevada': '32',
    'NewHampshire': '33',
    'NewJersey': '34',
    'NewMexico': '35',
    'NewYork': '36',
    'NorthCarolina': '37',
    'NorthDakota': '38',
    'Ohio': '39',
    'Oklahoma': '40',
    'Oregon': '41',
    'Pennsylvania': '42',
    'RhodeIsland': '44',
    'SouthCarolina': '45',
    'SouthDakota': '46',
    'Tennessee': '47',
    'Texas': '48',
    'Utah': '49',
    'Vermont': '50',
    'Virginia': '51',
    'Washington': '53',
    'WestVirginia': '54',
    'Wisconsin': '55',
    'Wyoming': '56'
}
