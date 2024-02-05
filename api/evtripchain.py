import pandas as pd
import numpy as np
import random
from collections import Counter
from scipy.stats import truncnorm

#def EVsampleTripsample(area_csv = 'vtrip2.csv', rrate = 0.10113):
def EVsampleTripsample(area_csv, nbev):
    pd.set_option('display.max_columns', None)
    print(area_csv)
    trip = pd.read_csv(area_csv)
    people = list(trip['person_id'].unique())

    # p_rate = rrate/100
    # EV_sample = random.sample(people, int(round(len(people) * p_rate,0)))
    EV_sample = random.sample(people, int(nbev))

    trip['sample'] = trip['person_id'].isin(EV_sample)
    trip_sample = trip[trip['sample']==True].copy()
    trip_sample = trip_sample.drop(columns=['sample'])
    trip_sample['end_period'] = round(trip_sample['depart_period']+trip_sample['travel_time']/30,0).astype('int64')
    
    return EV_sample, trip_sample

def visualizeTripData(trip_sample):
  real_time =  list(np.arange(0,24,0.5))
  time_diff = list(range(43,49))+list(range(1,43))
  time_cov = pd.Series(real_time,time_diff).to_dict()

  time_start = [time_cov[i] for i in trip_sample['depart_period']]

  real_time =  list(np.arange(0,24,0.5)) + list(np.arange(3,8,0.5))
  time_diff2 = list(range(43,49))+list(range(1,43)) + list(range(49,59))
  time_cov_endt = pd.Series(real_time,time_diff2).to_dict()

  time_end = [time_cov_endt[i] for i in trip_sample['end_period']]

  chain_length = trip_sample['person_id'].value_counts()

  trip_sample_not_home = trip_sample[trip_sample['dest_purpose'] != 'Home']
  trip_sample_home = trip_sample[trip_sample['dest_purpose'] == 'Home']

  trip_sample_work = trip_sample_not_home[(trip_sample['dest_purpose'] == 'work') 
                                          | (trip_sample['dest_purpose'] == 'Work')
                                        | (trip_sample['dest_purpose'] == 'atwork')]

  trip_sample_public = trip_sample_not_home[(trip_sample['dest_purpose'] != 'work') 
                                          & (trip_sample['dest_purpose'] != 'Work')
                                          & (trip_sample['dest_purpose'] != 'atwork')]

  time_start1 = [time_cov[i] for i in trip_sample_home['depart_period']]
  time_start2 = [time_cov[i] for i in trip_sample_work['depart_period']]
  time_start3 = [time_cov[i] for i in trip_sample_public['depart_period']]

  N_taz_trip = trip_sample['dest_taz'].value_counts().to_dict()
  N_taz_trip_not_home = trip_sample_not_home['dest_taz'].value_counts().to_dict()
  N_taz_trip_home = trip_sample_home['dest_taz'].value_counts().to_dict()

  N_taz_trip_work = trip_sample_work['dest_taz'].value_counts().to_dict()
  N_taz_trip_public = trip_sample_public['dest_taz'].value_counts().to_dict()

  return chain_length, trip_sample_work, trip_sample_public, trip_sample_home, time_start1, time_start2, time_start3

def make_EV_trips(EV_sample, trip_sample1):
  """ Convert into EV trip chain and put into time order """

  trip_sample = pd.DataFrame.from_dict(trip_sample1)

  ## a) convert into EV trip chain
  trip_use = {}
  for i in EV_sample: 
    trip_use[i] = {}
    trip_i = trip_sample[trip_sample['person_id']== i].copy()
    s_period = trip_i['depart_period'].unique()
    
    for j in range(len(s_period)):
        trip_use[i][j] = {}
        trip_i_j = trip_i[trip_i['depart_period']==s_period[j]]
        
        trip_use[i][j]['depart_period'] = s_period[j]
        trip_use[i][j]['travel_time'] = sum(trip_i_j['travel_time']) # in min (1=1min)
        trip_use[i][j]['end_period'] = round(trip_use[i][j]['depart_period'] + trip_use[i][j]['travel_time']/30,1) # 1=30min
        trip_use[i][j]['distance'] = round(sum(trip_i_j['distance']),1) # in mile
        if len(trip_i_j) == 1:
            trip_use[i][j]['o_taz'] = trip_i_j['orig_taz'].iloc[0] # from 1-5922
            trip_use[i][j]['d_taz'] = trip_i_j['dest_taz'].iloc[0] # # from 1-5922
            trip_use[i][j]['o_purpose'] = trip_i_j['orig_purpose'].iloc[0] 
            trip_use[i][j]['d_purpose'] = trip_i_j['dest_purpose'].iloc[0]
            
        else:    
            aa = list((Counter(trip_i_j['orig_taz']) - Counter(trip_i_j['dest_taz'])).elements())
            bb = list((Counter(trip_i_j['dest_taz']) - Counter(trip_i_j['orig_taz'])).elements())
            cc = list((Counter(trip_i_j['orig_purpose']) - Counter(trip_i_j['dest_purpose'])).elements())
            dd = list((Counter(trip_i_j['dest_purpose']) - Counter(trip_i_j['orig_purpose'])).elements())
            
            if len(aa) == 0:  # it's a circle trip, take the first trip's o and last trip's d
                trip_use[i][j]['o_taz'] = trip_i_j['orig_taz'].iloc[0]
                trip_use[i][j]['d_taz'] = trip_i_j['dest_taz'].iloc[len(trip_i_j)-1]
  
            else:
                trip_use[i][j]['o_taz'] = list(aa)[0] 
                trip_use[i][j]['d_taz'] = list(bb)[0]
            
            if len(cc) == 0:
                trip_use[i][j]['o_purpose'] = trip_i_j['orig_purpose'].iloc[0]
                trip_use[i][j]['d_purpose'] = trip_i_j['dest_purpose'].iloc[len(trip_i_j)-1]
            
            else:
                trip_use[i][j]['o_purpose'] = list(cc)[0] 
                trip_use[i][j]['d_purpose'] = list(dd)[0]

    for m in range(len(s_period)):     
        if m < len(s_period)-1: # if not the last trip of the day
            trip_use[i][m]['dwell_time'] = (trip_use[i][m+1]['depart_period']-trip_use[i][m]['end_period'])*30/60 # in hour
            
        else:    # if is the last trip of the day
            trip_use[i][m]['dwell_time'] = (48-trip_use[i][m]['end_period'] + trip_use[i][0]['depart_period'])*30/60 # in hour
        if trip_use[i][m]['dwell_time']< 0:
            trip_use[i][m]['dwell_time'] = 0
            if m < len(s_period)-1:
                trip_use[i][m]['end_period'] = trip_use[i][m+1]['depart_period'] 
            else:
                trip_use[i][m]['end_period'] =  trip_use[i][0]['depart_period']+48

  ## b) convert into EV trip in time order
  # convert trip chain into pandas
  trip_time_order = pd.DataFrame.from_dict({(i,j): trip_use[i][j]
                            for i in EV_sample 
                            for j in trip_use[i].keys()},
                        orient='index')
  trip_time_order.reset_index(inplace=True)  
  trip_time_order = trip_time_order.rename(columns={"level_0": "EV_list", "level_1": "tripID"}) # rename
  trip_time_order = trip_time_order[['end_period','d_taz','EV_list', 'tripID','d_purpose','distance','dwell_time']]
  #trip_time_order = trip_time_order.drop(columns = ['o_taz','o_purpose','travel_time','depart_period']) # drop unused
  trip_time_order = trip_time_order.sort_values(by=['end_period','d_taz'], ascending=True) # order by
  #trip_time_order = trip_time_order['end_period','d_taz',]

  EV_N_trips = trip_time_order['EV_list'].value_counts() # return a pandas series: EV_N_trips[EV.N] = its number of trips
  
  return trip_time_order, EV_N_trips

def make_En_cn(EV_sample, En, cn, prob_En):
  """ Define EV driving range by distribution """
  
  Snr = [0,1,2] # list used in the dictionary
  # list of En and Cn
  Scenario = np.random.choice(Snr, len(EV_sample), p=prob_En)
  # create En Cn for the EV list
  En_v = [En.get(n) for n in Scenario]
  cn_v = [cn.get(n) for n in Scenario]
  En_v = dict(zip(EV_sample, En_v))
  cn_v = dict(zip(EV_sample, cn_v))

  return En_v, cn_v

def make_SOC_init(EV_sample):
  """ Initial SOC """

  def get_truncated_normal(mean,sd, low, upp):
    #mean = low + (upp-low)/2
    return truncnorm(
        (low - mean) / sd, (upp - mean) / sd, loc=mean, scale=sd)

  mean, sd, low, upp = [0.7, 0.1, 0.3, 1.0]
  # sample initial SOC for the EV list
  SOC_int = get_truncated_normal(mean, sd, low, upp).rvs(size=len(EV_sample))
  # draw sampled initial SOC
  SOC_int = dict(zip(EV_sample, SOC_int))

  return SOC_int
