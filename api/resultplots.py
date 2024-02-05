import numpy as np
import pandas as pd

def f(ind_res, E_taz, trip_sample):
  map_D = 5
  result_p = ind_res 
  result_p = result_p.dropna()
  result_p_D = result_p[result_p['day'] == map_D].copy()

  result_p_D_charge = result_p_D[result_p_D['rate'] !=0 ].copy()
  charge_SOC = result_p_D_charge['SOC_s'].tolist()
  charge_time = (result_p_D_charge['charge_end_period']-result_p_D_charge['charge_start_period']).tolist()
  start_time = result_p_D_charge['charge_start_period'].tolist()
  print(result_p_D_charge)

  real_time =  list(np.arange(0,24,0.5)) + list(np.arange(3,8,0.5))
  time_diff2 = list(range(43,49))+list(range(1,43)) + list(range(49,59))
  time_cov_endt = pd.Series(real_time,time_diff2).to_dict()
  time_start = [time_cov_endt[int(i)] for i in start_time]

#   trip_use_p = trip_sample[['person_id','trip_id','dest_taz','dest_purpose']]
#   trip_use_p.rename(columns = {'person_id': 'N.EV', 'trip_id': 'N.trip'})
#   result_p_D_charge_t = pd.merge(result_p_D_charge, trip_use_p, how='left', on=['N.EV','N.trip'])
#   result_p_D_charge_t = result_p_D_charge_t[result_p_D_charge_t['dest_taz'] !=0]
#   result_p_D_charge_t['demand'] = result_p_D_charge_t['rate']*(result_p_D_charge_t['charge_end_period'] - result_p_D_charge_t['charge_start_period'])
  result_p_D_charge = result_p_D_charge[result_p_D_charge['charge_TAZ'] != 0]

  t_step = 1
  rate = np.sort(result_p_D_charge['rate'].unique())
  loc = ['home','work','public']

#   D_type = {}
#   for i in range(len(loc)):
#     D_type[loc[i]] = {}  
#     for j in range(1,4):
#         D_type[loc[i]][j]= 0

  L_type = {} 
  for i in range(1,4):
      L_type[i] = {}
      for j in range(len(loc)):
          L_type[i][loc[j]] = {}
          for t in np.arange(1,48.1,t_step):
              L_type[i][loc[j]][round(t, 2)] = 0

  for index, row in result_p_D_charge.iterrows():
    rt = row['rate']
    i = rate.tolist().index(rt)+1
    
    l_type = row['d_purpose']
    if l_type == 'Home':
        lt = loc[0]
    elif l_type == 'Work' or l_type == 'work':
        lt = loc[1]
    else:
        lt = loc[2]
    
    # D_type[lt][i] = D_type[lt][i] + row['charge_energy']

    a_time = row['charge_start_period']
    b_time = row['charge_end_period']

    for t in np.arange(1, 48.1, t_step):
        t = round(t, 2)
        if t >= a_time and t <= b_time:
            L_type[i][lt][t] = L_type[i][lt][t]+1
    if b_time >= 48:
        for t in np.arange(1,48.1,t_step):
            t = round(t, 2)
            if t <= b_time-48:
                L_type[i][lt][t] = L_type[i][lt][t]+1

  charge_rate = result_p_D_charge['rate'].tolist()
  home_count = charge_rate.count(3.6)

  work = result_p_D_charge.loc[(result_p_D_charge['d_purpose'] == 'work') | (result_p_D_charge['d_purpose'] == 'Work')]
  public = result_p_D_charge.loc[(result_p_D_charge['d_purpose'] != 'work') & (result_p_D_charge['d_purpose'] != 'Work') & (result_p_D_charge['d_purpose'] != 'Home')]
  work_rate = work['rate'].tolist()
  public_rate = public['rate'].tolist()

  workl2_count = work_rate.count(6.2)
  publicl2_count = public_rate.count(6.2)
  workdcfc_count = work_rate.count(150)
  publicdcfc_count = public_rate.count(150)
  print(home_count, workl2_count, publicl2_count, workdcfc_count, publicdcfc_count)

  labels = 'home L2','work L2', 'public L2', 'work DCFC', 'public DCFC'
  sizes = [home_count, workl2_count, publicl2_count, workdcfc_count, publicdcfc_count]

  print(L_type)

  return labels, sizes, L_type