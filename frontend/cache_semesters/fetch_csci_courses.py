import os
import json
import time
import requests

# this script is 1/2 of creating a csv with the prereqs for every CSCI course:
#
# it sends api requests to get ALL csci courses from fall 2021 to spring 2026
# and then saves each response as a json insde of cache/search. 

with open("cookies.json") as file:
    cookies = json.load(file)

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:137.0) Gecko/20100101 Firefox/137.0',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'en-US,en;q=0.5',
    # 'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Origin': 'https://cab.brown.edu',
    'Connection': 'keep-alive',
    'Referer': 'https://cab.brown.edu/',
    # 'Cookie': 'AMCV_4D6368F454EC41940A4C98A6%40AdobeOrg=179643557%7CMCIDTS%7C20146%7CMCMID%7C35620687361685143708671614397990958274%7CMCAID%7CNONE%7CMCOPTOUT-1740540362s%7CNONE%7CvVersion%7C5.5.0; __zlcmid=1QxnVZPFFXDFoMj; acceptcookies=false; fcsid=nosfgnrc57f8ur1ju0m0vvv5ap; AMP_572175c4a8=JTdCJTIyZGV2aWNlSWQlMjIlM0ElMjJhN2Y4ZDQwNS04NzE5LTRjNTQtODM4MC1iOTQ3ZDRhYTE3ZWMlMjIlMkMlMjJ1c2VySWQlMjIlM0ElMjI3ODUxOTk5YTYwN2ZjOWI2Y2EyMDUwNjM1NWVkMTgxN2U4NjcwMDcwNzI4NTIxZjNlY2I1YzIzNTcwNjAzMzA0JTIyJTJDJTIyc2Vzc2lvbklkJTIyJTNBMTc0NDgxNTIxNjQzMiUyQyUyMm9wdE91dCUyMiUzQWZhbHNlJTJDJTIybGFzdEV2ZW50VGltZSUyMiUzQTE3NDQ4MTU1MDUyNjQlMkMlMjJsYXN0RXZlbnRJZCUyMiUzQTQ1JTJDJTIycGFnZUNvdW50ZXIlMjIlM0E3JTdE; AMP_MKTG_572175c4a8=JTdCJTIycmVmZXJyZXIlMjIlM0ElMjJodHRwcyUzQSUyRiUyRnd3dy5nb29nbGUuY29tJTJGJTIyJTJDJTIycmVmZXJyaW5nX2RvbWFpbiUyMiUzQSUyMnd3dy5nb29nbGUuY29tJTIyJTdE; amplitude_id_9f6c0bb8b82021496164c672a7dc98d6_edmbrown.edu=eyJkZXZpY2VJZCI6IjdiNGEzZmQ2LTdjMmUtNGZjZC1iMzUxLTRjNTg1OTI1ODE5M1IiLCJ1c2VySWQiOm51bGwsIm9wdE91dCI6ZmFsc2UsInNlc3Npb25JZCI6MTc0NDY2MzMxODU5MywibGFzdEV2ZW50VGltZSI6MTc0NDY2MzMyMzg5OCwiZXZlbnRJZCI6MCwiaWRlbnRpZnlJZCI6MTUsInNlcXVlbmNlTnVtYmVyIjoxNX0=; IDMSESSID=5F4F6FE688A6974A45BB5DDF724B25B1D43F9B1F2904B921CD5E4D2BB297C5AC19E573A1A6BE903A2A963193973A2681; TS01b3a32b=014b44e76b2bfffa4bf11f672f482dda08cb75db42a613534f113167d5bf454488e2a1502795632863ba48809e01be925dd9ca685b',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'DNT': '1',
    'Sec-GPC': '1',
    'Priority': 'u=0',
    # Requests doesn't support trailers
    # 'TE': 'trailers',
}

# 1. map semester names --> srcdb codes
semester_to_srcdb = {
    "Fall 21": "202110", "Winter 21": "202115", "Spring 22": "202120", "Summer 22": "202200",
    "Fall 22": "202210", "Winter 22": "202215", "Spring 23": "202220", "Summer 23": "202300",
    "Fall 23": "202310", "Winter 23": "202315", "Spring 24": "202320", "Summer 24": "202400",
    "Fall 24": "202410", "Winter 24": "202415", "Spring 25": "202420", "Summer 25": "202500",
    "Fall 25": "202510", "Winter 25": "202515", "Spring 26": "202520"
}

# 2. make api request to search for "csci" in a given semester, save response json as cache
def cache_csci_search_results():
    os.makedirs("cache/search", exist_ok=True)
    base_url = "https://cab.brown.edu/api/?page=fose&route=search"

    for label, srcdb in semester_to_srcdb.items():
        filename = f"cache/search/CSCI-{srcdb}.json"
        if os.path.exists(filename):
            print(f"[SKIP] Already cached: {label}")
            continue

        payload = {
            "other": { "srcdb": srcdb },
            "criteria": [
                { "field": "subject", "value": "CSCI" },
                { "field": "is_ind_study", "value": "N" },
                { "field": "is_canc", "value": "N" }
            ]
        }

        print(f"[FETCH] {label} (srcdb: {srcdb})")
        try:
            response = requests.post(
                base_url,
                cookies=cookies,
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            full_data = response.json()

            # Filter to only include courses that have an "S01" section
            s01_crns = {
                item["code"] for item in full_data.get("results", [])
                if item.get("no") == "S01"
            }
            filtered_results = [
                item for item in full_data.get("results", [])
                if item.get("code") in s01_crns and item.get("no") == "S01"
            ]

            print(f"[FILTER] {len(filtered_results)} S01 sections retained")

            with open(filename, "w") as f:
                json.dump({ "results": filtered_results }, f, indent=2)

            print(f"[CACHED] Saved to {filename}")
            time.sleep(1.0)  # delay between requests to not spam API
        except Exception as e:
            print(f"[ERROR] {label}: {e}")

if __name__ == "__main__":
    cache_csci_search_results()