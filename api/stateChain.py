# Original trips
import os
import pickle

import pandas as pd

def stateChain(state):

    all_trip = pd.read_csv('vtrip/tvphdata.csv')
    all_trip.head()
    # remove longer than mileage trip
    max_range = 200
    all_trip.drop(all_trip[all_trip['TRPMILES'] > max_range].index, inplace=True)
    len(all_trip)
    # State trips
    # define state here
    chosen = ['HVID', 'HOUSEID', 'VEHID', 'PERSONID', 'TDTRPNUM',  # house_vehicleID...
              'TDWKND',  # weekday 'TRAVDAY',
              'STRTTIME', 'ENDTIME', 'DWELTIME',  # time
              'TRVLCMIN', 'TRPMILAD',  # travel time, miles
              'WHYFROM',  # origin purpose
              'WHYTRP1S',  # destination purpose
              'HH_CBSA',  # hosehold CBSA,
              'DTHTNRNT', 'DTEEMPDN', 'DTPPOPDN', 'DTRESDN'  # , 'DBHUR'
              # census tract: house rental percent, employment density, population density, housing density, block
              ]
    # CBSA: 35620 New York-Newark-Jersey City, NY-NJ-PA; 40380 Rochester, 15380 Buffalo-Cheektowaga-Niagara Falls, NY
    state_trip = all_trip[all_trip['HHSTATE'] == state][chosen].copy()  # in state
    print('Number of trips', len(state_trip))
    print('Number of vehicles', len(state_trip['HVID'].unique()))
    state_trip['TDWKND'].unique()
    # define week_day here

    week_day = 'weekday'  # 'weekend' , 'weekday'

    if week_day == 'weekend':
        state_trip = state_trip[state_trip['TDWKND'] == 1].copy()
    elif week_day == 'weekday':
        state_trip = state_trip[state_trip['TDWKND'] == 2].copy()
    len(state_trip)
    # convert start, end time into min. 0-1440 min in a day.
    state_trip['STRTTIME_min'] = [int(str(i)[:-2]) * 60 + int(str(i)[-2:]) if len(str(i)) >= 3 else i for i in
                                  state_trip['STRTTIME']]
    state_trip['ENDTIME_min1'] = [int(str(i)[:-2]) * 60 + int(str(i)[-2:]) if len(str(i)) >= 3 else i for i in
                                  state_trip['ENDTIME']]


    def endtime(row):
        if row['STRTTIME_min'] > row['ENDTIME_min1']:
            return row['ENDTIME_min1'] + 1440
        return row['ENDTIME_min1']


    state_trip['ENDTIME_min'] = state_trip.apply(lambda row: endtime(row), axis=1)
    # encode destination
    state_trip['dest_code'] = list(zip(state_trip['DTHTNRNT'],  # state_trip['DTEEMPDN'],
                                       state_trip['DTPPOPDN'],
                                       state_trip['DTRESDN']))  # state_trip['HH_CBSA'],#,state_trip['DBHUR']
    len(state_trip['dest_code'].unique())
    state_trip = state_trip.sort_values(by=['HVID', 'STRTTIME_min'])
    state_trip = state_trip.set_index(pd.Index(list(range(len(state_trip)))))
    tripID = []
    for index, row in state_trip.iterrows():

        if index == 0 or state_trip.iloc[index - 1]['HVID'] != row['HVID']:
            tripID.append(0)
        else:
            tripID.append(tripID[-1] + 1)
    state_trip['tripID'] = tripID
    state_trip.loc[(state_trip.DWELTIME < 0), 'DWELTIME'] = 0
    state_trip[state_trip['HVID'] == 407489641]

    # Prepare simulation data
    state_trip.head(3)
    trip_time_order = pd.DataFrame()
    trip_time_order['weekday'] = state_trip['TDWKND']
    trip_time_order['end_period'] = state_trip['ENDTIME_min']
    trip_time_order['start_period'] = state_trip['STRTTIME_min']
    trip_time_order['d_taz'] = state_trip['dest_code']
    trip_time_order['EV_list'] = state_trip['HVID']
    trip_time_order['tripID'] = state_trip['tripID']
    trip_time_order['d_purpose'] = state_trip['WHYTRP1S']
    trip_time_order['distance'] = state_trip['TRPMILAD']
    trip_time_order['dwell_time'] = state_trip['DWELTIME']
    trip_time_order = trip_time_order.sort_values(by=['tripID', 'start_period'])
    EV_N_trips = trip_time_order['EV_list'].value_counts()
    EV_sample = list(trip_time_order['EV_list'].unique())
    # adjust last trip's dwell time
    for index, row in trip_time_order.iterrows():
        # print(row['tripID'],row['EV_list'])
        if int(row['tripID']) - 1 == EV_N_trips[int(row['EV_list'])]:
            ev = int(row['EV_list'])
            next_day = int(trip_time_order.loc[(trip_time_order['EV_list'] == ev)
                                               & (trip_time_order['tripID'] == 1)]['start_period']) + 3600

            trip_time_order.loc[index, 'dwell_time'] = next_day - row['end_period']
            # print(next_day, row['dwell_time'])
    trip_time_order['end_period'] = round(trip_time_order['end_period'] / 30, 1) + 1
    trip_time_order['start_period'] = round(trip_time_order['start_period'] / 30, 1) + 1
    trip_time_order['d_purpose_code'] = trip_time_order['d_purpose']


    def purpose(row):
        if row['d_purpose_code'] == 1:
            return 'Home'
        elif row['d_purpose_code'] == 10:
            return 'Work'
        else:
            return 'Public'


    trip_time_order['d_purpose'] = trip_time_order.apply(lambda row: purpose(row), axis=1)
    trip_time_order
    trip_time_order[trip_time_order['EV_list'] == 407489641]
    # EV_N_trips[403375315]

    file_name = os.path.join("vtrip", f"{state}_EV_trip_weekend.p")

    with open(file_name, "wb") as f:
        pickle.dump(trip_time_order, f)

    return trip_time_order

abbreviations = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    'DC'
]

for abbreviation in abbreviations:
    stateChain(abbreviation)