import numpy as np
from behavior import *
import random
def sim_demand(ci_z, EV_sample, EV_trip, EV_N_trips, SOC_int, En_v, cn_v, shapefile, behavior_params, rate, rate_name, location_name, home_price, pub_price, D, Num_zone):#(ci_z,p_price):  # ci_z is a list of public charger 

    p_price = pub_price #all_inputes[0]
    #ci_z = np.delete(all_inputes, 0, axis=0).astype('int64')
    
    ciz_home = np.ones(Num_zone) # N. of home charger is a list of 1 
    ciz_list = np.concatenate((ciz_home, ci_z), axis=None)  # put home, public charger in one list 
    ciz = np.reshape(ciz_list, (3,Num_zone))  # convert into a 3*N.TAZ matrix
    
    
    fail_EV = [] # store fail to charge EV
        
    E_taz = {} #charging energy =[day][TAZ][charger type][location type][total charge energy]
        
    result = {} # individual charge result = [day][n.EV][n.trip][xxx of the trip] n.trip contains n+1 trips, from 0 to n. The extra one to store SOC_s

    ciz_t = {} # charger availability = [day][loc(type charger i), loc(TAZ), loc(time step)]

    tt_step = 0.1 #time-step 0.1*30 min
    tt = np.around(np.arange(1,49,tt_step),1).tolist() # tt=1.0-48.9   49 represent the next '1'
    
    # predefine data structure
    for d in range(D+1): # D+1 days: in range 0 to D
        E_taz[d] = {}
        ciz_t[d] = np.repeat(ciz[:, :, np.newaxis], len(tt), axis=2)  #ciz_t[d]=[type charger i, TAZ-1, time step]

        result[d] = {}
        for i in EV_sample: # each N.EV
            result[d][i]={}
            for j in range(EV_N_trips[i]+1): # n+1 trips / EV
                result[d][i][j]={}
        
        for z in np.sort(shapefile['new_zone_name'].unique()): # TAZ, from 1 to 5922
            E_taz[d][z] = {}
            for r in rate_name: # charger type: home level2, public level 2, public DCFC
                E_taz[d][z][r] = {}
                for l in location_name:
                    E_taz[d][z][r][l] = 0 # initialize charge energy = 0
                    
    # start iteration
    for d in range(D): # for each day
        for ind, row in EV_trip.iterrows(): # iterate over trips
            
            # define values in this iteration
            ev_i = row['EV_list'] # define the N. EV
            nn_trip = EV_N_trips[ev_i] # total N. of trips of the EV
            N_trip = row['tripID'] # the Nth trip of this EV
            pps = row['d_purpose'] # destination purpose
            zzone = int(row['d_taz']) # destination TAZ
            end_t = row['end_period'] # trip end time = charge start time
            dist = row['distance'] # travel distance
            dwell = row['dwell_time'] # dwell time
            
            #print(row)
            
            pps_hwp = 0 # define location type: home, work, public
            if pps == 'Home':
                pps_hwp = location_name[0]
            elif pps == 'Work' or pps == 'work':
                pps_hwp = location_name[1]
            else:
                pps_hwp = location_name[2]
                        
            # check if ev in fail list, if yes skip
            if ev_i in fail_EV: # skip fail to charge EV
                continue
            
            # update ev energy
            #result[d][ev_i][N_trip]['En'] = En_v[ev_i]
            
            # update ev cn
            #result[d][ev_i][N_trip]['cn'] = cn_v[ev_i]

            # update charge start time
            result[d][ev_i][N_trip]['charge_start_period'] = end_t
                
            # update charge zone (TAZ)
            result[d][ev_i][N_trip]['charge_TAZ'] = int(zzone)
            
            # update charge purpose
            result[d][ev_i][N_trip]['d_purpose'] = pps
            
            # update dwell time
            result[d][ev_i][N_trip]['dwell time'] = dwell
            
            #print(row)
            
            # initialize start SOC of the first trip 
            if d == 0 and N_trip == 0:  # if the first day, the first trip. start SOC is pre-defined
                result[d][ev_i][N_trip]['SOC_s'] = SOC_int[ev_i]
            elif d != 0 and N_trip == 0: # not the first day, the first trip. start SOC is the last day's end 
                result[d][ev_i][N_trip]['SOC_s'] = result[d-1][ev_i][nn_trip]['SOC_s'] # nn_trip is the one extra trip in last day, used to store real last trip's end charging status
            ### the non-first trip's start SOC will be updated later

            # update end of trip SOC    
            result[d][ev_i][N_trip]['SOC_e'] = result[d][ev_i][N_trip]['SOC_s'] - cn_v[ev_i] * dist / En_v[ev_i] 

            if result[d][ev_i][N_trip]['SOC_e']  <0: # add fail to charge EV, skip
                fail_EV = fail_EV + [ev_i]
                continue                      
   
    
            if dwell == 0: # if not stop at the destination
                c_choice[0] = 0
            else:
                # update charger availability:
                L_avlb = [0,0,0]
                loc_z = zzone-1 # loc(taz)

                if end_t < 49: # charge start in this d (day)
                    loc_t = tt.index(end_t) # loc(charge start time)
                    
                    # update available charger
                    result[d][ev_i][N_trip]['N.charger_available'] = ciz_t[d][:,loc_z,loc_t]   


                    if pps == 'Home': # if home always available
                        #if ciz_t[d][0,loc_z,loc_t]!=0:
                        L_avlb[0] = 1
                    else: # if location is work or public
                        if ciz_t[d][1,loc_z,loc_t] > 0:
                            L_avlb[1] = 1
                        if ciz_t[d][2,loc_z,loc_t] > 0:
                            L_avlb[2] = 1      

                else: # end_t >= 49 charge start time is the next day
                        loc_t2 = tt.index(round(end_t-48,1)) # loc(charge start time)
                        
                        # update available charger
                        result[d][ev_i][N_trip]['N.charger_available'] = ciz_t[d+1][:,loc_z,loc_t2] 
                        
                        if pps == 'Home': # if home always available
                            #if ciz_t[d+1][0,loc_z,loc_t2]!=0:
                            L_avlb[0] = 1
                        else: # if location is work or public
                            if ciz_t[d+1][1,loc_z,loc_t2]!=0:
                                L_avlb[1] = 1
                            if ciz_t[d+1][2,loc_z,loc_t2]!=0:
                                L_avlb[2] = 1    

                #if result[d][ev_i][N_trip]['SOC_e'] >=1:
                    #print(result[0][ev_i],result[1][ev_i],result[2][ev_i],result[3][ev_i])

                # draw charge choice
                choicee = charging_choice(result[d][ev_i][N_trip]['SOC_e'],dwell,En_v[ev_i],L_avlb,p_price, rate, home_price, behavior_params)
                c_choice = choicee[0]
                prob = choicee[1]

                 # save location availability
                result[d][ev_i][N_trip]['L_available'] = L_avlb
                # save choice
                result[d][ev_i][N_trip]['choice'] = c_choice
                # save choice probability
                result[d][ev_i][N_trip]['choice_prob'] =   prob#[round(num, 1) for num in prob]

                            
            if c_choice[0] == 0: # if not charge
                # update charge power
                rratee = 0
                result[d][ev_i][N_trip]['rate'] = rratee
               
                # update charge end time
                c_end_t = end_t
                result[d][ev_i][N_trip]['charge_end_period'] = end_t     
                
                # update charge energy
                result[d][ev_i][N_trip]['charge_energy'] = 0
                
                # update start SOC of next trip     
                result[d][ev_i][N_trip+1]['SOC_s'] = result[d][ev_i][N_trip]['SOC_e']
                

            else: # if charge
                # update charge power
                loc_rate = c_choice[0]-1
                rratee = rate[loc_rate]
                result[d][ev_i][N_trip]['rate'] = rratee
                
                # update charge time
                max_charge_time = En_v[ev_i]*(1-result[d][ev_i][N_trip]['SOC_e'])/rratee # in hour
                result[d][ev_i][N_trip]['max_charge_time']=max_charge_time
                charge_time = round(min(max_charge_time,dwell),3) # in hour
                result[d][ev_i][N_trip]['charge_time']=charge_time
                
                # update charge end period
                c_end_t = round(end_t+charge_time*2,1)  # charge_end time
                result[d][ev_i][N_trip]['charge_end_period'] = c_end_t               
                    
                # update charge energy
                result[d][ev_i][N_trip]['charge_energy'] = rratee*charge_time # in kW
                
                # update TAZ charge energy
                E_taz[d][zzone][rate_name[loc_rate]][pps_hwp] = E_taz[d][zzone][rate_name[loc_rate]][pps_hwp] + result[d][ev_i][N_trip]['charge_energy']
                                        
                # update start SOC of next trip    
                result[d][ev_i][N_trip+1]['SOC_s'] = min(1,result[d][ev_i][N_trip]['SOC_e'] + rratee*charge_time/En_v[ev_i])
                    
                # update available charger for the charging period
                if rratee == 0: # if not charge, skip
                    continue
                if pps == 'Home': # if home, don't update charger
                    continue

                if end_t < 49 and c_end_t < 49:
                    t1 = tt.index(end_t)
                    t2 = tt.index(c_end_t)
                    for ta in range(t1,t2+1):
                        ciz_t[d][loc_rate,loc_z,ta]= ciz_t[d][loc_rate,loc_z,ta]-1


                elif end_t < 49 and c_end_t >= 49:
                    t1 = tt.index(end_t)
                    t2 = tt.index(round(c_end_t-48,1))
                    for ta in range(t1,len(tt)):
                        ciz_t[d][loc_rate,loc_z,ta]= ciz_t[d][loc_rate,loc_z,ta]-1
                    for ta in range(0,t2+1):
                        ciz_t[d+1][loc_rate,loc_z,ta]= ciz_t[d+1][loc_rate,loc_z,ta]-1


                elif end_t >= 49:
                    t1 = tt.index(round(end_t-48,1))
                    t2 = tt.index(round(c_end_t-48,1))
                    for ta in range(t1,t2+1):
                        ciz_t[d+1][loc_rate,loc_z,ta]= ciz_t[d+1][loc_rate,loc_z,ta]-1
                            
    return fail_EV, E_taz, result, ciz_t

def sim_demandNEW(ci_z, EV_sample, EV_trip, EV_N_trips, SOC_int, En_v, cn_v, shapefile, behavior_params, rate, rate_name, location_name, home_price, pub_price, D, Num_zone):  # (ci_z,p_price):  # ci_z is a list of public charger

    p_price = pub_price  # all_inputes[0]
    # ci_z = np.delete(all_inputes, 0, axis=0).astype('int64')

    ciz_home = np.ones(Num_zone)  # N. of home charger is a list of 1
    ciz_list = np.concatenate((ciz_home, ci_z), axis=None)  # put home, public charger in one list
    ciz = np.reshape(ciz_list, (3, Num_zone))  # convert into a 3*N.TAZ matrix

    fail_EV = []  # store fail to charge EV

    E_taz = {}  # charging energy =[day][TAZ][charger type][location type][total charge energy]

    result = {}  # individual charge result = [day][n.EV][n.trip][xxx of the trip] n.trip contains n+1 trips, from 0 to n. The extra one to store SOC_s

    ciz_t = {}  # charger availability = [day][loc(type charger i), loc(TAZ), loc(time step)]

    tt_step = 0.1  # time-step 0.1*30 min
    tt = np.around(np.arange(1, 49, tt_step), 1).tolist()  # tt=1.0-48.9   49 represent the next '1'

    # predefine data structure
    for d in range(D + 1):  # D+1 days: in range 0 to D
        E_taz[d] = {}
        ciz_t[d] = np.repeat(ciz[:, :, np.newaxis], len(tt), axis=2)  # ciz_t[d]=[type charger i, TAZ-1, time step]

        result[d] = {}
        for i in EV_sample:  # each N.EV
            result[d][i] = {}
            for j in range(EV_N_trips[i] + 1):  # n+1 trips / EV
                result[d][i][j] = {}

        for z in np.sort(EV_trip['d_taz'].unique()):  # TAZ, from 1 to 5922
            E_taz[d][z] = {}
            for r in rate_name:  # charger type: home level2, public level 2, public DCFC
                E_taz[d][z][r] = {}
                for l in location_name:
                    E_taz[d][z][r][l] = 0  # initialize charge energy = 0

    print("demandsim")
    print(D)
    # start iteration
    for d in range(D):  # for each day
        for ind, row in EV_trip.iterrows():  # iterate over trips

            # define values in this iteration
            ev_i = row['EV_list']  # define the N. EV
            nn_trip = EV_N_trips[ev_i]  # total N. of trips of the EV
            N_trip = row['tripID']  # the Nth trip of this EV
            pps = row['d_purpose']  # destination purpose
            zzone = int(row['d_taz'])  # destination TAZ
            end_t = row['end_period']  # trip end time = charge start time
            dist = row['distance']  # travel distance
            dwell = row['dwell_time']  # dwell time

            # print(row)

            pps_hwp = 0  # define location type: home, work, public
            if pps == 'Home':
                pps_hwp = location_name[0]
            elif pps == 'Work' or pps == 'work':
                pps_hwp = location_name[1]
            else:
                pps_hwp = location_name[2]

            # check if ev in fail list, if yes skip
            if ev_i in fail_EV:  # skip fail to charge EV
                continue

            # update ev energy
            # result[d][ev_i][N_trip]['En'] = En_v[ev_i]

            # update ev cn
            # result[d][ev_i][N_trip]['cn'] = cn_v[ev_i]

            # update charge start time
            result[d][ev_i][N_trip]['charge_start_period'] = end_t

            # update charge zone (TAZ)
            result[d][ev_i][N_trip]['charge_TAZ'] = int(zzone)

            # update charge purpose
            result[d][ev_i][N_trip]['d_purpose'] = pps

            # update dwell time
            result[d][ev_i][N_trip]['dwell time'] = dwell

            # print(row)

            # initialize start SOC of the first trip
            if d == 0 and N_trip == 0:  # if the first day, the first trip. start SOC is pre-defined
                result[d][ev_i][N_trip]['SOC_s'] = SOC_int[ev_i]
            elif d != 0 and N_trip == 0:  # not the first day, the first trip. start SOC is the last day's end
                result[d][ev_i][N_trip]['SOC_s'] = result[d - 1][ev_i][nn_trip][
                    'SOC_s']  # nn_trip is the one extra trip in last day, used to store real last trip's end charging status
            ### the non-first trip's start SOC will be updated later

            # update end of trip SOC

            result[d][ev_i][N_trip]['SOC_e'] = result[d][ev_i][N_trip]['SOC_s'] - cn_v[ev_i] * dist / En_v[ev_i]

            if result[d][ev_i][N_trip]['SOC_e'] < 0:  # add fail to charge EV, skip
                fail_EV = fail_EV + [ev_i]
                continue

            if dwell == 0:  # if not stop at the destination
                c_choice = 0
            else:
                # update charger availability:
                L_avlb = [0, 0, 0]
                loc_z = zzone - 1  # loc(taz)

                if end_t < 49:  # charge start in this d (day)
                    loc_t = tt.index(end_t)  # loc(charge start time)

                    # update available charger
                    result[d][ev_i][N_trip]['N.charger_available'] = ciz_t[d][:, loc_z, loc_t]

                    if pps == 'Home':  # if home always available
                        # if ciz_t[d][0,loc_z,loc_t]!=0:
                        L_avlb[0] = 1
                    else:  # if location is work or public
                        if ciz_t[d][1, loc_z, loc_t] > 0:
                            L_avlb[1] = 1
                        if ciz_t[d][2, loc_z, loc_t] > 0:
                            L_avlb[2] = 1

                else:  # end_t >= 49 charge start time is the next day
                    loc_t2 = tt.index(round(end_t - 48, 1))  # loc(charge start time)

                    # update available charger
                    result[d][ev_i][N_trip]['N.charger_available'] = ciz_t[d + 1][:, loc_z, loc_t2]

                    if pps == 'Home':  # if home always available
                        # if ciz_t[d+1][0,loc_z,loc_t2]!=0:
                        L_avlb[0] = 1
                    else:  # if location is work or public
                        if ciz_t[d + 1][1, loc_z, loc_t2] != 0:
                            L_avlb[1] = 1
                        if ciz_t[d + 1][2, loc_z, loc_t2] != 0:
                            L_avlb[2] = 1

                            # if result[d][ev_i][N_trip]['SOC_e'] >=1:
                # print(result[0][ev_i],result[1][ev_i],result[2][ev_i],result[3][ev_i])

                # draw charge choice
                choicee = charging_choice(result[d][ev_i][N_trip]['SOC_e'], dwell, En_v[ev_i], L_avlb, p_price,rate, home_price, behavior_params)
                #choicee = charging_choice(result[d][ev_i][N_trip]['SOC_e'],dwell,En_v[ev_i],L_avlb,p_price, rate, home_price, behavior_params)
                c_choice = choicee[0]
                prob = choicee[1]

                # save location availability
                result[d][ev_i][N_trip]['L_available'] = L_avlb
                # save choice
                result[d][ev_i][N_trip]['choice'] = c_choice
                # save choice probability
                result[d][ev_i][N_trip]['choice_prob'] = prob  # [round(num, 1) for num in prob]

            if c_choice == 0:  # if not charge
                # update charge power
                rratee = 0
                result[d][ev_i][N_trip]['rate'] = rratee

                # update charge end time
                c_end_t = end_t
                result[d][ev_i][N_trip]['charge_end_period'] = end_t

                # update charge energy
                result[d][ev_i][N_trip]['charge_energy'] = 0

                # update start SOC of next trip
                result[d][ev_i][N_trip + 1]['SOC_s'] = result[d][ev_i][N_trip]['SOC_e']


            else:  # if charge
                # update charge power
                loc_rate = c_choice[0] - 1
                rratee = rate[loc_rate]
                result[d][ev_i][N_trip]['rate'] = rratee

                # update charge time
                max_charge_time = En_v[ev_i] * (1 - result[d][ev_i][N_trip]['SOC_e']) / rratee  # in hour
                result[d][ev_i][N_trip]['max_charge_time'] = max_charge_time
                charge_time = round(min(max_charge_time, dwell), 3)  # in hour
                result[d][ev_i][N_trip]['charge_time'] = charge_time

                # update charge end period
                c_end_t = round(end_t + charge_time * 2, 1)  # charge_end time
                result[d][ev_i][N_trip]['charge_end_period'] = c_end_t

                # update charge energy
                result[d][ev_i][N_trip]['charge_energy'] = rratee * charge_time  # in kW

                # update TAZ charge energy
                E_taz[d][zzone][rate_name[loc_rate]][pps_hwp] = E_taz[d][zzone][rate_name[loc_rate]][pps_hwp] + \
                                                                result[d][ev_i][N_trip]['charge_energy']

                # update start SOC of next trip
                result[d][ev_i][N_trip + 1]['SOC_s'] = min(1, result[d][ev_i][N_trip]['SOC_e'] + rratee * charge_time /
                                                           En_v[ev_i])

                # update available charger for the charging period
                if rratee == 0:  # if not charge, skip
                    continue
                if pps == 'Home':  # if home, don't update charger
                    continue

                if end_t < 49 and c_end_t < 49:
                    t1 = tt.index(end_t)
                    t2 = tt.index(c_end_t)
                    for ta in range(t1, t2 + 1):
                        ciz_t[d][loc_rate, loc_z, ta] = ciz_t[d][loc_rate, loc_z, ta] - 1


                elif end_t < 49 and c_end_t >= 49:
                    t1 = tt.index(end_t)
                    t2 = tt.index(round(c_end_t - 48, 1))
                    for ta in range(t1, len(tt)):
                        ciz_t[d][loc_rate, loc_z, ta] = ciz_t[d][loc_rate, loc_z, ta] - 1
                    for ta in range(0, t2 + 1):
                        ciz_t[d + 1][loc_rate, loc_z, ta] = ciz_t[d + 1][loc_rate, loc_z, ta] - 1


                elif end_t >= 49:
                    t1 = tt.index(round(end_t - 48, 1))
                    t2 = tt.index(round(c_end_t - 48, 1))
                    for ta in range(t1, t2 + 1):
                        ciz_t[d + 1][loc_rate, loc_z, ta] = ciz_t[d + 1][loc_rate, loc_z, ta] - 1

    return fail_EV, E_taz, result, ciz_t

# For Home Only
def sim_demandAVAI(ci_z, EV_sample, EV_trip, EV_N_trips, SOC_int, En_v, cn_v, shapefile, behavior_params, rate, rate_name, location_name, home_price, pub_price, D, Num_zone, avai_L2, avai_DC):  # (ci_z,p_price):  # ci_z is a list of public charger

    p_price = pub_price  # all_inputes[0]
    # ci_z = np.delete(all_inputes, 0, axis=0).astype('int64')

    ciz_home = np.ones(Num_zone)  # N. of home charger is a list of 1
    # ciz_list = np.concatenate((ciz_home, ci_z), axis=None)  # put home, public charger in one list
    # ciz = np.reshape(ciz_list, (3,Num_zone))  # convert into a 3*N.TAZ matrix

    fail_EV = []  # store fail to charge EV

    E_taz = {}  # charging energy =[day][TAZ][charger type][location type][total charge energy]

    result = {}  # individual charge result = [day][n.EV][n.trip][xxx of the trip] n.trip contains n+1 trips, from 0 to n. The extra one to store SOC_s

    # ciz_t = {} # charger availability = [day][loc(type charger i), loc(TAZ), loc(time step)]

    tt_step = 0.1  # time-step 0.1*30 min
    tt = np.around(np.arange(1, 49, tt_step), 1).tolist()  # tt=1.0-48.9   49 represent the next '1'

    # predefine data structure
    for d in range(D + 1):  # D+1 days: in range 0 to D
        E_taz[d] = {}
        # ciz_t[d] = np.repeat(ciz[:, :, np.newaxis], len(tt), axis=2)  #ciz_t[d]=[type charger i, TAZ-1, time step]

        result[d] = {}
        for i in EV_sample:  # each N.EV
            result[d][i] = {}
            for j in range(EV_N_trips[i] + 1):  # n+1 trips / EV
                result[d][i][j] = {}

        for z in np.sort(EV_trip['d_taz'].unique()):  # TAZ, from 1 to 5922
            E_taz[d][z] = {}
            for r in rate_name:  # charger type: home level2, public level 2, public DCFC
                E_taz[d][z][r] = {}
                for l in location_name:
                    E_taz[d][z][r][l] = 0  # initialize charge energy = 0

    # start iteration
    for d in range(D):  # for each day
        for ind, row in EV_trip.iterrows():  # iterate over trips

            # define values in this iteration
            ev_i = row['EV_list']  # define the N. EV
            nn_trip = EV_N_trips[ev_i]  # total N. of trips of the EV
            N_trip = row['tripID']  # the Nth trip of this EV
            pps = row['d_purpose']  # destination purpose
            zzone = int(row['d_taz'])  # destination TAZ
            end_t = row['end_period']  # trip end time = charge start time
            dist = row['distance']  # travel distance
            dwell = row['dwell_time']  # dwell time

            # print(row)

            pps_hwp = 0  # define location type: home, work, public
            if pps == 'Home':
                pps_hwp = location_name[0]
            elif pps == 'Work' or pps == 'work':
                pps_hwp = location_name[1]
            else:
                pps_hwp = location_name[2]

            # check if ev in fail list, if yes skip
            if ev_i in fail_EV:  # skip fail to charge EV
                continue

            # update ev energy
            # result[d][ev_i][N_trip]['En'] = En_v[ev_i]

            # update ev cn
            # result[d][ev_i][N_trip]['cn'] = cn_v[ev_i]

            # update charge start time
            result[d][ev_i][N_trip]['charge_start_period'] = end_t

            # update charge zone (TAZ)
            result[d][ev_i][N_trip]['charge_TAZ'] = int(zzone)

            # update charge purpose
            result[d][ev_i][N_trip]['d_purpose'] = pps

            # update dwell time
            result[d][ev_i][N_trip]['dwell time'] = dwell

            # print(row)

            # initialize start SOC of the first trip
            if d == 0 and N_trip == 0:  # if the first day, the first trip. start SOC is pre-defined
                result[d][ev_i][N_trip]['SOC_s'] = SOC_int[ev_i]
            elif d != 0 and N_trip == 0:  # not the first day, the first trip. start SOC is the last day's end
                result[d][ev_i][N_trip]['SOC_s'] = result[d - 1][ev_i][nn_trip][
                    'SOC_s']  # nn_trip is the one extra trip in last day, used to store real last trip's end charging status
            ### the non-first trip's start SOC will be updated later

            # update end of trip SOC
            result[d][ev_i][N_trip]['SOC_e'] = result[d][ev_i][N_trip]['SOC_s'] - cn_v[ev_i] * dist / En_v[ev_i]

            if result[d][ev_i][N_trip]['SOC_e'] < 0:  # add fail to charge EV, skip
                fail_EV = fail_EV + [ev_i]
                continue

            if dwell == 0:  # if not stop at the destination
                c_choice = 0
            else:
                # update charger availability:
                L_avlb = [0, 0, 0]
                loc_z = zzone - 1  # loc(taz)

                if pps == 'Home':  # if home always available
                    # if ciz_t[d][0,loc_z,loc_t]!=0:
                    L_avlb[0] = 1
                else:  # if location is work or public

                    L_avlb[1] = random.choices([0, 1], weights=[1 - avai_L2, avai_L2], k=1)[0]

                    L_avlb[2] = random.choices([0, 1], weights=[1 - avai_DC, avai_DC], k=1)[0]

                    # if result[d][ev_i][N_trip]['SOC_e'] >=1:
                    # print(result[0][ev_i],result[1][ev_i],result[2][ev_i],result[3][ev_i])

                # draw charge choice
                #choicee = charging_choice(result[d][ev_i][N_trip]['SOC_e'], dwell, En_v[ev_i], L_avlb, p_price)
                choicee = charging_choice(result[d][ev_i][N_trip]['SOC_e'], dwell, En_v[ev_i], L_avlb, p_price, rate,
                                          home_price, behavior_params)
                c_choice = choicee[0]
                prob = choicee[1]

                # save location availability
                result[d][ev_i][N_trip]['L_available'] = L_avlb
                # save choice
                result[d][ev_i][N_trip]['choice'] = c_choice
                # save choice probability
                result[d][ev_i][N_trip]['choice_prob'] = prob  # [round(num, 1) for num in prob]

            if c_choice == 0:  # if not charge
                # update charge power
                rratee = 0
                result[d][ev_i][N_trip]['rate'] = rratee

                # update charge end time
                c_end_t = end_t
                result[d][ev_i][N_trip]['charge_end_period'] = end_t

                # update charge energy
                result[d][ev_i][N_trip]['charge_energy'] = 0

                # update start SOC of next trip
                result[d][ev_i][N_trip + 1]['SOC_s'] = result[d][ev_i][N_trip]['SOC_e']


            else:  # if charge
                # update charge power
                loc_rate = c_choice[0] - 1
                rratee = rate[loc_rate]
                result[d][ev_i][N_trip]['rate'] = rratee

                # update charge time
                max_charge_time = En_v[ev_i] * (1 - result[d][ev_i][N_trip]['SOC_e']) / rratee  # in hour
                result[d][ev_i][N_trip]['max_charge_time'] = max_charge_time
                charge_time = round(min(max_charge_time, dwell), 3)  # in hour
                result[d][ev_i][N_trip]['charge_time'] = charge_time

                # update charge end period
                c_end_t = round(end_t + charge_time * 2, 1)  # charge_end time
                result[d][ev_i][N_trip]['charge_end_period'] = c_end_t

                # update charge energy
                result[d][ev_i][N_trip]['charge_energy'] = rratee * charge_time  # in kW

                # update TAZ charge energy
                E_taz[d][zzone][rate_name[loc_rate]][pps_hwp] = E_taz[d][zzone][rate_name[loc_rate]][pps_hwp] + \
                                                                result[d][ev_i][N_trip]['charge_energy']

                # update start SOC of next trip
                result[d][ev_i][N_trip + 1]['SOC_s'] = min(1, result[d][ev_i][N_trip]['SOC_e'] + rratee * charge_time /
                                                           En_v[ev_i])

                # update available charger for the charging period
                if rratee == 0:  # if not charge, skip
                    continue
                if pps == 'Home':  # if home, don't update charger
                    continue

    return fail_EV, E_taz, result