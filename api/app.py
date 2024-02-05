from flask import Flask, make_response, send_file, request, jsonify, send_from_directory
from flask_cors import CORS
import time
import geopandas as gpd
import json
import numpy as np
from evtripchain import *
from runsimulation import *
from runsimNEW import *

app = Flask(__name__)
#CORS(app, resources={r"/*": {"origins": "http://127.0.0.1:3000"}})
CORS(app)
#CORS(app, resources={r"/*": {"origins": "http://128.253.5.64"}})

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

# API for the pictures in the first section.
@app.route('/api/travel_demand/<name>/<metro_value>/<share_value>', methods=['GET'])
def travel_demand_time(name, metro_value, share_value):
    # Find the picture using the arguments.
    file_path = "./pictures/" + metro_value + share_value + "/TravelDemand/" + name + ".png"
    # print the corresponding value for debug use
    # print("file_path: ", file_path)
    # print("metro_value: ", metro_value)
    # print("share_value: ", share_value)

    # JSONify the response
    response = make_response(send_file(file_path, mimetype='image/png'))
    response.headers['Content-Transfer-Encoding'] = 'base64'
    return response

@app.route('/api/charging_demand/<name>/<metro_value>/<share_value>/<user_behavior>', methods=['GET'])
def charging_demand_energy_total(name, metro_value, share_value, user_behavior):
    file_path = "./pictures/" + metro_value + share_value + "/ChargingDemand/" + user_behavior + "/" + name + ".png"
    # print("file_path: ", file_path)
    # print("metro_value: ", metro_value)
    # print("share_value: ", share_value)
    # print("user_behavior: ", user_behavior)

    response = make_response(send_file(file_path, mimetype='image/png'))
    response.headers['Content-Transfer-Encoding'] = 'base64'
    return response

@app.route('/api/charging_demand_specific/<metro_value>/<share_value>/<user_behavior>/<charging_mode>/<start_time>', methods=['GET'])
def charging_demand_specific(metro_value, share_value, user_behavior, charging_mode, start_time):
    file_path = "./pictures/" + metro_value + share_value + "/ChargingDemand/" + user_behavior + "/Power" + charging_mode + start_time + ".png"
    # print("file_path: ", file_path)
    # print("metro_value: ", metro_value)
    # print("share_value: ", share_value)
    # print("user_behavior: ", user_behavior)
    # print("charging_mode: ", charging_mode)
    # print("start_time: ", start_time)

    response = make_response(send_file(file_path, mimetype='image/png'))
    response.headers['Content-Transfer-Encoding'] = 'base64'
    return response

@app.route('/api/getcounties/<area>', methods=['GET'])
def getcounty(area):
    if area == "Atlanta":
        shapefile = gpd.read_file("map/Model_Traffic_Analysis_Zones_2020.shp")
        county = shapefile[['COUNTY', 'geometry', 'OBJECTID']]
        county = county.dissolve(by='COUNTY', aggfunc='sum')
        county = county.reset_index()
        return county.to_json()
    else:
        return None

@app.route('/api/areaDescription/<area>', methods=['GET'])
def description(area):
    atlantaDes = "Atlanta Metropolitan area, located in Georgia, U.S. is the third-largest metropolitan region in the south-eastern U.S. and the fourth-fastest-growing metropolitan area in the U.S. The area contains 21 counties and 5922 Traffic analytic zones (TAZs)."
    atlantaDes2 = " Individual trip data for the year 2030 were simulated by the Atlanta Regional Commission (ARC), which contains 4.9 million vehicles and 21.3 million typical commuting trips."
    otherDes = "This area is not yet supported."
    if (area == "Atlanta"):
        return atlantaDes + atlantaDes2
    return otherDes

def convert_to_float(value, default):
    try:
        return round(float(value), 2)
    except ValueError:
        return default

@app.route('/api/overview/<area>', methods=['GET'])
def getDataInf(area):

    dayType = request.args.get('dayType', 'default')
    #print(dayType)
    nov_V = request.args.get('nov', 'default')
    #print(nov_V)

    nov_V = convert_to_float(nov_V, 50000)

    ev, rate_V ,oldnumVec, oldnumTrip, newnumVec, newnumTrip, average_D ,EV_list_data, start_period_data, distance_data = getOverview(dayType,area,nov_V)

    # Convert the dictionaries to pandas Series
    ev_list_of_dicts = ev.to_dict(orient='records')
    EV_list_series = pd.Series(EV_list_data, name="EV_list")
    start_period_series = pd.Series(start_period_data, name="start_period")
    distance_series = pd.Series(distance_data, name="distance")
    # Create a dictionary of these series
    data_mapping = {
        'evData': ev_list_of_dicts,
        'newnumVec': newnumVec,
        'newnumTrip': newnumTrip,
        'oldnumVec': oldnumVec,
        'oldnumTrip': oldnumTrip,
        'EV_list': EV_list_series.to_dict(),
        'start_period': start_period_series.to_dict(),
        'distance': distance_series.to_dict(),
        'aveDis': average_D,
        'rate': rate_V
    }
    # Convert the data_mapping to JSON
    data_json = json.dumps(data_mapping)

    return data_json


@app.route('/api/loadAreaData/<area>/<nbev>', methods=['GET'])
def loadDataRoute(area, nbev):
    if(area == "Atlanta"):
        # EV_sample, trip_sample = EVsampleTripsample('vtrip2.csv', 0.10113) #float(rrate)
        EV_sample, trip_sample = EVsampleTripsample('vtrip/vtrip2.csv', nbev)

        EV_sample_json = json.dumps(EV_sample, cls=NpEncoder)
        trip_sample_json = trip_sample.to_json()
        obj = {'EV_sample': EV_sample_json, 'trip_sample': trip_sample_json}
        return obj
    else:
        return None

@app.route('/api/runsimulationmodelN', methods=['POST'])
def runsimulationmodelN():
    starttime = time.time()
    json = request.get_json()
    print(json)

    # evData = json['EV_data']
    area = json['area']
    dayT = json['dayType']


    homeP = convert_to_float(json['homePrice'], 0.13)
    publicP = convert_to_float(json['publicPrice'], 0.43)
    L2_V = convert_to_float(json['L2'], 1)
    DCFC_V = convert_to_float(json['DCFC'], 1)

    NOV_V = convert_to_float(json['marketShare'], 50000)
    print(NOV_V)

    betaSOC = 3
    if (json['riskSensitivity'] == "risk-high"):
        betaSOC = 2
    if (json['riskSensitivity'] == "risk-low"):
        betaSOC = 8

    betaR = 0
    if (json['willingnessToPay'] == "willingness-positive"):
        betaR = 0.005
    if (json['willingnessToPay'] == "willingness-negative"):
        betaR = -0.005

    SOCB = 0.2
    if (json['rangeBuffer'] == "buffer-10"):
        SOCB = 0.1
    if (json['rangeBuffer'] == "buffer-30"):
        SOCB = 0.3

    shares = json['BEVgroupShares']
    shares_f = [float(s)/100 for s in shares]

    print("Calling simulate() ", time.time())

    typeday, power_demand, bus_power, publicRate, workRate, charge_by_geoid = simulateNew(dayT, area, betaSOC, betaR, SOCB, homeP, publicP, L2_V, DCFC_V, NOV_V)
    print("here")
    #print(typeday)
    typeday = convert_keys(typeday)
    power_demand = convert_keys(power_demand)

    def compute_averages(data):
        new_data = {}
        # Removing the data of the first two days (i.e., the first 96 numbers)
        days_to_skip = 1
        start_index = days_to_skip * 48
        # Extracting only the values for the remaining four days
        for place, values in data.items():
            values_list = list(values.values())[start_index:]
            # Calculate the average for each time slot over all remaining days
            num_days = len(values_list) // 48
            averages = [
                sum(values_list[i::48]) / num_days
                for i in range(48)
            ]
            # Store the computed averages as a day's data
            new_data[place] = dict(enumerate(averages))

        # Smoothing the new_data after computing the averages

        if len(values_list)>200:

            for place, values in new_data.items():
                values_list = list(values.values())
                smoothed_values = []
                # For the first two values
                smoothed_values.append(sum(values_list[:3]) / 3)
                smoothed_values.append(sum(values_list[:4]) / 4)

                # For middle values
                for i in range(2, len(values_list) - 2):
                    smoothed_values.append(sum(values_list[i - 2:i + 3]) / 5)

                # For the last two values
                smoothed_values.append(sum(values_list[-4:]) / 4)
                smoothed_values.append(sum(values_list[-3:]) / 3)

                # Replace values in new_data with smoothed values
                new_data[place] = dict(enumerate(smoothed_values))

        return new_data

    def compute_averages_bus(data):
        new_data = {}
        # Removing the data of the first two days (i.e., the first 96 numbers)
        days_to_skip = 0
        start_index = days_to_skip * 24
        # Extracting only the values for the remaining four days
        for place, values in data.items():
            values_list = list(values.values())[start_index:]
            # Calculate the average for each time slot over all remaining days
            num_days = len(values_list) // 24
            averages = [
                sum(values_list[i::24]) / num_days
                for i in range(24)
            ]
            # Store the computed averages as a day's data
            new_data[place] = dict(enumerate(averages))

        # Smoothing the new_data after computing the averages
        print(len(values_list))
        if len(values_list)>100:
            for place, values in new_data.items():
                values_list = list(values.values())
                smoothed_values = []
                # For the first two values
                # smoothed_values.append(sum(values_list[:3]) / 3)
                # smoothed_values.append(sum(values_list[:4]) / 4)
                smoothed_values.append(sum(values_list[:2]) / 2)
                # For middle values
                # for i in range(2, len(values_list) - 2):
                #     smoothed_values.append(sum(values_list[i - 2:i + 3]) / 5)
                for i in range(1, len(values_list) - 1):
                    smoothed_values.append(sum(values_list[i - 1:i + 2]) / 3)

                # For the last two values
                # smoothed_values.append(sum(values_list[-4:]) / 4)
                # smoothed_values.append(sum(values_list[-3:]) / 3)
                smoothed_values.append(sum(values_list[-2:]) / 2)
                # Replace values in new_data with smoothed values
                new_data[place] = dict(enumerate(smoothed_values))

        return new_data

    def extract_data(data):
        new_data = {}
        for key in data:
            # Convert the first array to a dictionary with indices as keys
            temp_dict = {index: item for index, item in enumerate(data[key][0])}
            new_data[key] = temp_dict
        return new_data

    bus_power = extract_data(bus_power)

    typeday = compute_averages(typeday)
    power_demand = compute_averages(power_demand)

    bus_power = compute_averages_bus(bus_power)

    def convert_keys_to_str(data):
        if isinstance(data, dict):
            return {str(key): convert_keys_to_str(value) for key, value in data.items()}
        elif isinstance(data, list):
            return [convert_keys_to_str(item) for item in data]
        else:
            return data

    typeday = convert_keys_to_str(typeday)
    power_demand = convert_keys_to_str(power_demand)
    bus_power = convert_keys_to_str(bus_power)
    #print(bus_power)

    return jsonify({"typeday": typeday}, {"powerday": power_demand}, {"buspower": bus_power}, {"publicRate": publicRate}, {"workRate": workRate}, {"charges": charge_by_geoid})

@app.route('/api/runsimulationmodel', methods=['POST'])
def runsimulationmodel():
    starttime = time.time()
    json = request.get_json()
    #print(json)
    betaSOC = 3
    if (json['riskSensitivity'] == "risk-high"):
        betaSOC = 2
    if (json['riskSensitivity'] == "risk-low"):
        betaSOC = 8

    betaR = 0
    if (json['willingnessToPay'] == "willingness-positive"):
        betaR = 0.005
    if (json['willingnessToPay'] == "willingness-negative"):
        betaR = -0.005

    SOCB = 0.2
    if (json['rangeBuffer'] == "buffer-10"):
        SOCB = 0.1
    if (json['rangeBuffer'] == "buffer-30"):
        SOCB = 0.3

    shares = json['BEVgroupShares']
    shares_f = [float(s)/100 for s in shares]

    print("Calling simulate() ", time.time())

    ind_res, E_taz, E_use, labels, sizes, L_type, E_use_h2, E_use_l2, E_use_l3 = simulate(json['EV_sample'], json['trip_sample'], betaSOC, betaR, SOCB, shares_f)
    ind_res_j = ind_res.to_json(orient='records')
    E_taz_j = E_taz.to_json(orient='records')
    E_use_j = E_use.to_dict('records')
    E_use_h2_j = E_use_h2.to_dict('records')
    E_use_l2_j = E_use_l2.to_dict('records')
    E_use_l3_j = E_use_l3.to_dict('records')

    elapsed_time = time.time() - starttime
    print("returning. total time elapsed: ", elapsed_time)
    return {'time': elapsed_time, 'ind_res': ind_res_j, 'E_taz': E_taz_j, 'E_use': E_use_j, 'labels': labels, 'sizes': sizes, 'L_type': L_type, 'E_use_h2': E_use_h2_j, 'E_use_l2': E_use_l2_j, 'E_use_l3': E_use_l3_j}

class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NpEncoder, self).default(obj)

def convert_keys(input_dict):
    """Recursively convert dictionary keys from int64 to int."""
    if isinstance(input_dict, dict):
        return {int(k) if isinstance(k, np.int64) or isinstance(k, np.int32) else k: convert_keys(v) for k, v in input_dict.items()}
    return input_dict

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
