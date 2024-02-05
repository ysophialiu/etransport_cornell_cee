import geopandas as gpd
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
import numpy as np
import pandas as pd
import json
import requests
import fiona
import os

STATEFIPS = {
    '01':	'Alabama',
    '02':	'Alaska',
    '04':	'Arizona',
    '05':	'Arkansas',
    '06':	'California',
    '08':	'Colorado',
    '09':	'Connecticut',
    '10':	'Delaware',
#    '11':	'District of Columbia',
    '12':	'Florida',
    '13':	'Georgia',
    '15':	'Hawaii',
    '16':	'Idaho',
    '17':	'Illinois',
    '18':	'Indiana',
    '19':	'Iowa',
    '20':	'Kansas',
    '21':	'Kentucky',
    '22':	'Louisiana',
    '23':	'Maine',
    '24':	'Maryland',
    '25':	'Massachusetts',
    '26':	'Michigan',
    '27':	'Minnesota',
    '28':	'Mississippi',
    '29':	'Missouri',
    '30':	'Montana',
    '31':	'Nebraska',
    '32':   'Nevada',
    '33':	'New Hampshire',
    '34':	'New Jersey',
    '35':	'New Mexico',
    '36':	'New York',
    '37':	'North Carolina',
    '38':	'North Dakota',
    '39':	'Ohio',
    '40':	'Oklahoma',
    '41':	'Oregon',
    '42':	'Pennsylvania',
    '44':	'Rhode Island',
    '45':	'South Carolina',
    '46':	'South Dakota',
    '47':	'Tennessee',
    '48':	'Texas',
    '49':	'Utah',
    '50':	'Vermont',
    '51':	'Virginia',
    '53':	'Washington',
    '54':	'West Virginia',
    '55':	'Wisconsin',
    '56':	'Wyoming'
}

#DTHTNRNT: percent of renter-occupied housing
#DTEEMPDN: workers per square mile
#DTPPOPDN: population density (persons per square mile
#DTRESDN: housing units per square mile

def DTHTNRNT(row):
    val = row['rental-percent']
    #print(val)
    dic = {0.04:0, 0.14:5, 0.24:20, 0.34:30, 0.44:40, 0.54:50, 0.64:60, 0.74:70, 0.84:80, 0.94:90}
    for i in dic:
        if val <= i:
            return dic[i]
            break
    return 95


def DTEEMPDN(row):
    val = row['worker_density']
    #print(val)
    dic = {49:25, 99:75, 249:150, 499:350, 999:750, 1999:1500, 3999:3000}
    for i in dic:
        if val <= i:
            return dic[i]
            break
    return 5000

def DTPPOPDN(row):
    val = row['pop_density']
    #print(val)
    dic = {99:50, 499:300, 999:750, 1999:1500, 3999:3000, 9999:7000, 24999:17000}
    for i in dic:
        if val <= i:
            return dic[i]
            break
    return 30000


def DTRESDN(row):
    val = row['house_density']
    #print(val)
    dic = {99:50, 499:300, 999:750, 1999:1500, 3999:3000, 9999:7000, 24999:17000}
    for i in dic:
        if val <= i:
            return dic[i]
            break
    return 30000

def county_name(row):
    val = row['NAME']
    parts = val.split(', ') #tract number, county name, state name
    return parts[1]

"""
builds shapefile for a state
download census tract shapefiles from Census TIGER, extract to census directory
shapefiles will be augmented with demographic data from census api to get categories used by simulation
"""
def buildShapefile(year, statefips):
    #load shapefile
    shapefile = gpd.read_file("census/tl_" + year + "_" + statefips + "_tract/tl_" + year + "_" + statefips + "_tract.shp")
    #shapefile = shapefile.rename(columns={"TRACTCE": "tract"})

    #get demographic data
    link ='https://api.census.gov/data/' + year + '/acs/acs5?get=NAME,B01003_001E,B25001_001E,B25003_003E,B08203_001E&for=tract:*&in=state:' + statefips
    js = (requests.get(link)).json()

    #convert into pandas
    census = pd.DataFrame(js)
    census.columns = census.iloc[0]
    census = census.drop(index=0)
    census = census.rename(columns={"B01003_001E": "population"})
    census['population'] = census['population'].astype('int32')

    census = census.rename(columns={"B25001_001E": "housing_unit"})
    census['housing_unit'] = census['housing_unit'].astype('int32')

    census = census.rename(columns={"B25003_003E": "renter_unit"})
    census['renter_unit'] = census['renter_unit'].astype('int32')

    census = census.rename(columns={"B08203_001E": "num_workers"})
    census['num_workers'] = census['num_workers'].astype('int32')

    #combine county and tract because TRACT NUMBERS ARE NOT UNIQUE ACROSS THE STATE
    census['GEOID'] = census['state'] + census['county'] + census['tract']

    #A = set(census['tract'].unique())
    #B = set(shapefile['tract'].unique())
    #B-A

    shapefile['ceter_point'] = list(shapefile.centroid)

    #print('original crs', shapefile.crs)
    shapefile = shapefile.to_crs(epsg = 3857)
    #print('Geodetic coordinate system for North America',shapefile.crs)

    # area per square mile (from m^2 to mile^2)
    area = {}
    for index, row in shapefile.iterrows():
        area[row['GEOID']] = round(row['geometry'].area*(0.0006**2),2)
    census['area']= census['GEOID'].map(area)

    # calculating demographic densities
    census['rental-percent'] = census['renter_unit']/census['housing_unit']
    census['worker_density']=census['num_workers']/census['area']
    census['pop_density']=census['population']/census['area']
    census['house_density']=census['housing_unit']/census['area']

    # apply grouping functions to density columns
    census['DTPPOPDN'] = census.apply(lambda row: DTPPOPDN(row), axis=1)
    census['DTEEMPDN'] = census.apply(lambda row: DTEEMPDN(row), axis=1)
    census['DTHTNRNT'] = census.apply(lambda row: DTHTNRNT(row), axis=1)
    census['DTRESDN'] = census.apply(lambda row: DTRESDN(row), axis=1)
    census['county'] = census.apply(lambda row: county_name(row), axis=1)

    # category is a tuple of density values (must be as string for file write later)
    census['category'] = list(zip(census['DTHTNRNT'],#######census['DTEEMPDN'],
                                       census['DTPPOPDN'],census['DTRESDN']))
    #census['category'] = census.apply(lambda row: str(row['category']), axis=1)
    print('number of location type:', len(census['category'].unique()))

    return census

    # map census values back to shapefile
    '''shapefile['DTHTNRNT']= shapefile['tract'].map(dict(zip(census.tract,census.DTHTNRNT)))
    shapefile['DTEEMPDN']= shapefile['tract'].map(dict(zip(census.tract,census.DTEEMPDN)))
    shapefile['DTPPOPDN']= shapefile['tract'].map(dict(zip(census.tract,census.DTPPOPDN)))
    shapefile['DTRESDN']= shapefile['tract'].map(dict(zip(census.tract,census.DTRESDN)))
    shapefile['des_category']= shapefile['tract'].map(dict(zip(census.tract,census.category)))

    shapefile['renter_unit']= shapefile['tract'].map(dict(zip(census.tract,census.renter_unit)))
    shapefile['num_workers']= shapefile['tract'].map(dict(zip(census.tract,census.num_workers)))
    shapefile['population']= shapefile['tract'].map(dict(zip(census.tract,census.population)))
    shapefile['housing_unit']= shapefile['tract'].map(dict(zip(census.tract,census.housing_unit)))

    shapefile['NAME']= shapefile['tract'].map(dict(zip(census.tract,census.NAME)))
    shapefile['county']= shapefile['tract'].map(dict(zip(census.tract,census.county)))

    shapefile.to_file('./shapes/' + STATEFIPS[statefips] + '_shape.json', driver="GeoJSON")'''

if __name__ == '__main__':
    for key in STATEFIPS:
        print('BUILDING SHAPEFILE FOR: ', STATEFIPS[key])
        state_data = buildShapefile('2015', key)
        state_data.to_pickle('./census/' + key + '_census.pkl')