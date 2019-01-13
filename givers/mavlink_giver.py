import sys
import argparse
from time import sleep

import websocket
import json

import serial


# Parses MAVLink data as JSON string
def mavlink_as_json(port=None):
    # TODO Retrieve data from port

    # TODO Replace random with correct values
    data = {
        "online": True,
        "roll": random.uniform(0.0, 360.0),
        "pitch": random.uniform(0.0, 360.0),
        "yaw": random.uniform(0.0, 360.0),
    }

    return json.dumps(data)


def main():
    # Parse parameters
    parser = argparse.ArgumentParser(description="Decode and send MAVLink data from serial port to Team13 DroneVis Server.")
    parser.add_argument("-d", default=None, metavar="<device>", required=True,
                        help="serial device")
    parser.add_argument("-b", type=int, default=115200, metavar="<baud rate>",
                        help="baud rate (default: 115200)")
    parser.add_argument("-r", type=int, default=4, metavar="<stream rate>",
                        help="stream rate (default: 4)")
    parser.add_argument("-a", type=str, default="0.0.0.0:8000", metavar="<ip:port>",
                        help="address of DroneVis Server (default: 0.0.0.0:8000 - local server)")
    parser.add_argument("-i", type=int, default=100, metavar="<interval>",
                        help="interval of packet sending in milliseconds, too low might cause connection issues (default: 100)")
    parser.add_argument("-v", action="store_true", default=False,
                        help="verbose output (log all data to stdout)")
    args = parser.parse_args()

    if ":" not in args.a:
        parser.error("argument -a: invalid choice: {} (must contain IP and port)".format(args.a))
        return 1

    if args.i < 1:
        parser.error("argument -i: invalid choice: {} (choose above 0)".format(args.i))
        return 1

    if args.b < 0:
        parser.error("argument -b: invalid choice: {} (choose above 0)".format(args.b))
        return 1

    if args.r < 0:
        parser.error("argument -r: invalid choice: {} (choose above 0)".format(args.r))
        return 1

    # Convert milliseconds to seconds
    seconds = args.i / 1000.0

    # Connect to WebSocket
    socketUrl = "ws://{}/socket/1/".format(args.a)
    print("Connecting to: {}...".format(socketUrl))

    try:
        conn = websocket.create_connection(socketUrl)
    except Exception as e:
        print("Error! Unable to open WebSocket connection!\n=> {}".format(e))
        return 2

    print("Connected!")

    # TODO Open serial port

    # Send data until keyboard interrupt or connection error
    try:
        while True:
            data = mavlink_as_json()

            if args.v:
                print(data)

            ws.send(data)
            sleep(seconds)
    except KeyboardInterrupt:
        print("Closing connection...")
    except Exception as e:
        print("Error! Connection lost!\n=> {}".format(e))

    # Cleanup
    conn.close()

    return 0


if __name__ == "__main__":
    sys.exit(main())
