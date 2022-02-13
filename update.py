import json
import subprocess
import requests
import urllib.request
from time import sleep
import PySimpleGUI as sg

pbar = None
downloaded = None
size = None


def check_update():
    try:
        with open("version.json", "r") as f:
            data = json.loads(f.read())
    except:
        data = {"version": "0"}
    version = data["version"]
    response = requests.get("https://api.github.com/repos/Drizzyt77/workout/releases/latest")

    if version != latest_version:
        url = f'https://github.com/Drizzyt77/workout/releases/download/{latest_version}/main.exe'
        filename = 'bot.js'
        urllib.request.urlretrieve(url, filename)
        data["version"] = latest_version
        with open("version.json", "w") as f:
            json.dump(data, f, indent=2)
        subprocess.Popen(['RunBot.bat'])
    else:
        subprocess.Popen(['RunBot.bat'])


if __name__ == '__main__':
    check_update()
