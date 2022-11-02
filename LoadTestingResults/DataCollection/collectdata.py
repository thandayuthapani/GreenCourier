import json
import subprocess
import sys
import pandas as pd
import logging, coloredlogs
import os
import requests
from influxdb import InfluxDBClient
# from AutoScaling.shell import shell
import numpy as np

#Step -> 5 secs

coloredlogs.install()


default_config = {
    'queries_file_path': './DataCollection/queries.json',
    'query_base': '/api/v1/query_range?query=',
    'data_storage_path': './DataCollection/data/'
}

class DataCollector:
    def __init__(self,
                 queries_file_path = default_config['queries_file_path'],
                 query_base=default_config['query_base'],
                 data_storage_path=default_config['data_storage_path'],
                 ):
        self.queries_file_path = queries_file_path
        self.data_storage_path = data_storage_path
        self.query_base = query_base
        # read cluster config file and parse it
        with open(self.queries_file_path, 'r') as json_file:
            queries_data = json_file.read()
        # parse file
        self.queries_data = json.loads(queries_data)
        self.data_save = pd.DataFrame()


    def get_k6_requests_data(self, start_timestamp, end_timestamp,
                                          k6_host, k6_port, test_name, function_type, output_dir_path):
            clientK6 = InfluxDBClient(k6_host, k6_port, "", "", test_name)
            if function_type == "gRPC":
                queries_k6 = self.queries_data['queries_k6_load_test_gRPC']
            else:
                queries_k6 = self.queries_data['queries_k6_load_test_http']

            data_function = pd.DataFrame()
            for query_type in queries_k6:
                query_details = queries_k6[query_type]
                query = query_details['query_prefix'] + str(start_timestamp) + query_details['query_postfix'] + \
                        str(end_timestamp) + query_details['query_further_postfix'] + ';'
                logging.info(f'{query}')
                queryResult =  clientK6.query(query)
                logging.info(f'{queryResult}')
                data = pd.DataFrame(queryResult[query_details['name']])
                data.columns = ['timestamp', query_type]
                data_function['timestamp'] = pd.to_datetime(data['timestamp']).astype(int)/ 10**9
                data_function[query_type] = data[query_type]
            # data_function.to_csv(dir_path + 'k6_data' + '.csv')
            # print(data_function)
            # data_function.to_csv('./test_k6_data' + '.csv')
            data_function.to_csv(output_dir_path + '/' + 'test_k6_data' + '.csv')
    
    def get_knative_data(self, service_names, queries, start_timestamp, end_timestamp, prometheus_host, prometheus_port, output_dir_path):
        queries_per_function = self.queries_data["queries_knative"]
        for service_name in service_names:
            data_function = pd.DataFrame()
            for query_type in queries:
                query_details = queries_per_function[query_type]
                query = query_details['query_prefix'] + service_name + query_details['query_postfix']
                if query_details['query_further_postfix']:
                    query += self.queries_data['irate_normalization_time'] + \
                             query_details['query_further_postfix'] + "&start=" + \
                             str(start_timestamp) + "&end=" + str(end_timestamp) + "&step=" + \
                             str(self.queries_data['step'])
                else:
                    query += "&start=" + str(start_timestamp) + "&end=" + str(end_timestamp) + "&step=" + \
                             str(self.queries_data['step'])
                final_url = "http://" + prometheus_host + ":" + prometheus_port + self.query_base + query
                logging.info(f'Final URL: {final_url}')
                x = requests.get(final_url)
                if x.status_code == 200:
                    for result in x.json()['data']['result']:
                        logging.info(f'Result: {result}')
                        name = query_type
                        data = pd.DataFrame(result['values'], columns=['timestamp', name])
                        data = data.replace('NaN', 0)
                        data = data.fillna(0)
                        data_function['timestamp'] = data['timestamp']
                        data_function[name] = data[name].values
                        data_function.fillna(0, inplace=True)
            data_function.to_csv(output_dir_path + "/"+service_name + '_knative_data' + '.csv')

    