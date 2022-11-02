import os
import pandas as pd
import logging, coloredlogs
import argparse
import json
import os
import time
import re

# 7-bit C1 ANSI sequences
ansi_escape = re.compile(r'''
    \x1B  # ESC
    (?:   # 7-bit C1 Fe (except CSI)
        [@-Z\\-_]
    |     # or [ for CSI, followed by a control sequence
        \[
        [0-?]*  # Parameter bytes
        [ -/]*  # Intermediate bytes
        [@-~]   # Final byte
    )
''', re.VERBOSE)


from DataCollection import DataCollector
from Shell import shell

coloredlogs.install()

#Automate Discovery of Services that need to be tested

#Assumption that k6 is installed on the system
def start_k6_gRPC_run(influxdpip, influxdpport, service_url, service_name, filename):
    # result_service_url = shell(f'./get_service_name_url.sh {service_name}')
    logging.info(f'Service URL: {service_url}')
    result = shell(f'./runk6test.sh {influxdpip} {influxdpport} {service_url} {service_name} {filename}')
    result_lines = result.split("\n")
    return result_lines

def get_function_execution_time_k6(filename, output_dir_abs_path):
        # logging.info(f'sshpass -p {k6systempass} ssh -t {k6systemuserid}@{k6systemip} ./copy_k6_result_file.sh {filename} {output_dir_abs_path} {currentsystempass} {currentsystemuserid} {currentsystemip}')
        # result = shell(f'sshpass -p {k6systempass} ssh -t {k6systemuserid}@{k6systemip} ./copy_k6_result_file.sh {filename} {output_dir_abs_path} {currentsystempass} {currentsystemuserid} {currentsystemip}')
        logging.info(f'./copy_k6_result_file.sh {filename}')
        result = shell(f'./copy_k6_result_file.sh {filename}')
        result = shell(f'mv {filename} {output_dir_abs_path}')
        result_lines = result.split("\n")
        logging.info(f'result_lines: {result_lines}')

def parse_k6_logs(output_dir_path, filename):
    function_execution_times = {}
    with open(os.path.join(output_dir_path, filename)) as file:
        lines = file.readlines()
        for line in lines:
            result = ansi_escape.sub('', line)
            index_req = result.find("{")
            if index_req != -1:
                json_result = result[index_req:]
                temp = json.loads(json_result)
                # logging.info(f'Message: {temp["message"]}')
                if len(temp["message"]):
                    message_split = temp["message"].split(",")
                    # print(message_split)
                    function_name = message_split[1].strip(" ")[:-1]
                    function_execution_time = float(message_split[2].strip(" ").split(" ")[1])
                    # logging.info(f'Function Name: {function_name}, Function Execution Time: {function_execution_time}')
                    if function_name not in function_execution_times:
                        function_execution_times[function_name] = [function_execution_time]
                    else:
                        function_execution_times[function_name].append(function_execution_time)
                # logging.info(f'Time: {temp["Time"]}')
            else:
                logging.info(f'Incorrect Message, Check Logs')
    # logging.info(f'{function_execution_times}')     
    timestr = time.strftime("%Y%m%d-%H%M%S")
    with open(output_dir_path + '/function_execution_times-'+ timestr + '.txt', 'w') as convert_file:
        convert_file.write(json.dumps(function_execution_times))

def start_test(function_url, function_name):
    

    logging.info(f'Starting AutoScaling Test')
    timestr = time.strftime("%Y%m%d-%H%M%S")
    dir_name =  "AutoScalingResults-" + timestr
    logging.info(f'Creating Data Collection Dir')
    output_dir_path = "./data/"+dir_name
    os.mkdir(output_dir_path)
    curr_path = os.path.dirname(os.path.abspath(__file__))
    logging.info(f'Current Path: {curr_path}')
    output_dir_abs_path = curr_path + "/data/" + dir_name
    logging.info(f'Output Dir Abs Path: {output_dir_abs_path}')
    data_collector_obj = DataCollector()

    with open('./Cluster/config.json', 'r') as json_file:
        config_data = json_file.read()
    config_data = json.loads(config_data)

    #5 mins before the loadtest
    start_time = int(time.time()) - (3 * 60)

    logging.info(f'Starting k6 Test')

    k6_run_result = start_k6_gRPC_run(config_data["influx-db-ip"], config_data["influx-dp-port"], function_url, function_name, config_data["filename"])
    # logging.info(f'k6 Run Result [{k6_run_result}]')

    logging.info(f'Finished k6 Test')

    #3 mins after the load test
    end_time = int(time.time()) + (3 * 60)
    time.sleep(4* 60)    

    logging.info(f'Parsing Data')

    get_function_execution_time_k6(config_data["filename"], output_dir_abs_path)
    parse_k6_logs(output_dir_path, config_data["filename"])
    
    data_collector_obj.get_k6_requests_data(start_time, end_time, config_data["influx-db-ip"], \
        config_data["influx-dp-port"], config_data["dbname"], "gRPC", output_dir_path)

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    parser = argparse.ArgumentParser()
    parser.add_argument('-u', '--url', type=str)
    parser.add_argument('-n', '--funcname', type=str)
    args = parser.parse_args()
    start_test(args.url, args.funcname)


