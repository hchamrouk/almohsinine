import requests
from bs4 import BeautifulSoup
from datetime import datetime
import re
import json


URL = "https://mawaqit.net/fr/al-mouhsinine-beaucaire"
OUTPUT = "prayer_times.json"


def get_data():
    response = requests.get(
        URL,
        headers={
            "User-Agent": "Mozilla/5.0"
        },
        timeout=10
    )

    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    conf_pattern = re.compile(
        r"let\s+confData\s*=\s*(\{.*?\});",
        re.DOTALL
    )

    mosque_id_pattern = re.compile(
        r"let\s+mosqueId\s*=\s*(\d+)"
    )

    conf = None
    mosque_id = None

    for script in soup.find_all("script"):
        if not script.string:
            continue

        if conf is None:
            match = conf_pattern.search(script.string)

            if match:
                conf = json.loads(match.group(1))

        if mosque_id is None:
            match = mosque_id_pattern.search(script.string)

            if match:
                mosque_id = int(match.group(1))

        if conf is not None and mosque_id is not None:
            break

    if conf is None:
        raise RuntimeError("can't find confData.")

    if mosque_id is None:
        raise RuntimeError("can't find mosqueId")

    return conf, mosque_id


def main():
    conf, mosque_id = get_data()

    calendar = conf["calendar"]
    iqama_calendar = conf["iqamaCalendar"]

    prayer_indices = {
        "fajr": 0,
        "shuruq": 1,
        "dhuhr": 2,
        "asr": 3,
        "maghrib": 4,
        "isha": 5
    }

    iqama_indices = {
        "fajr": 0,
        "dhuhr": 1,
        "asr": 2,
        "maghrib": 3,
        "isha": 4
    }

    result = {
        "mosque": conf["name"],
        "mosque_id": mosque_id,
        "timezone": conf["timezone"],
        "year": datetime.now().year,
        "prayers": {}
    }

    for month_index, month in enumerate(calendar, start=1):
        result["prayers"][str(month_index)] = {}

        for day, times in month.items():
            iqama_times = iqama_calendar[month_index - 1][day]
            day_data = {}

            for prayer, time_index in prayer_indices.items():
                prayer_time = times[time_index]

                if prayer in iqama_indices:
                    iqama_offset = iqama_times[iqama_indices[prayer]]
                else:
                    iqama_offset = None

                day_data[prayer] = {
                    "time": prayer_time,
                    "iqama_offset": iqama_offset
                }

            result["prayers"][str(month_index)][day] = day_data

    with open(OUTPUT, "w", encoding="utf-8") as file:
        json.dump(
            result,
            file,
            ensure_ascii=False,
            indent=4
        )

    print(f"JSON created : {OUTPUT}")


if __name__ == "__main__":
    main()