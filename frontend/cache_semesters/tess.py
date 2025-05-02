import requests
import json

# Set this to your actual headers and cookies from an authenticated CAB session
cookies = {
    'AMCV_4D6368F454EC41940A4C98A6%40AdobeOrg': '179643557%7CMCIDTS%7C20146%7CMCMID%7C35620687361685143708671614397990958274%7CMCAID%7CNONE%7CMCOPTOUT-1740540362s%7CNONE%7CvVersion%7C5.5.0',
    '__zlcmid': '1QxnVZPFFXDFoMj',
    'acceptcookies': 'false',
    'fcsid': 'nosfgnrc57f8ur1ju0m0vvv5ap',
    'AMP_572175c4a8': 'JTdCJTIyZGV2aWNlSWQlMjIlM0ElMjJhN2Y4ZDQwNS04NzE5LTRjNTQtODM4MC1iOTQ3ZDRhYTE3ZWMlMjIlMkMlMjJ1c2VySWQlMjIlM0ElMjI3ODUxOTk5YTYwN2ZjOWI2Y2EyMDUwNjM1NWVkMTgxN2U4NjcwMDcwNzI4NTIxZjNlY2I1YzIzNTcwNjAzMzA0JTIyJTJDJTIyc2Vzc2lvbklkJTIyJTNBMTc0NDgxNTIxNjQzMiUyQyUyMm9wdE91dCUyMiUzQWZhbHNlJTJDJTIybGFzdEV2ZW50VGltZSUyMiUzQTE3NDQ4MTU1MDUyNjQlMkMlMjJsYXN0RXZlbnRJZCUyMiUzQTQ1JTJDJTIycGFnZUNvdW50ZXIlMjIlM0E3JTdE',
    'AMP_MKTG_572175c4a8': 'JTdCJTIycmVmZXJyZXIlMjIlM0ElMjJodHRwcyUzQSUyRiUyRnd3dy5nb29nbGUuY29tJTJGJTIyJTJDJTIycmVmZXJyaW5nX2RvbWFpbiUyMiUzQSUyMnd3dy5nb29nbGUuY29tJTIyJTdE',
    'amplitude_id_9f6c0bb8b82021496164c672a7dc98d6_edmbrown.edu': 'eyJkZXZpY2VJZCI6IjdiNGEzZmQ2LTdjMmUtNGZjZC1iMzUxLTRjNTg1OTI1ODE5M1IiLCJ1c2VySWQiOm51bGwsIm9wdE91dCI6ZmFsc2UsInNlc3Npb25JZCI6MTc0NDY2MzMxODU5MywibGFzdEV2ZW50VGltZSI6MTc0NDY2MzMyMzg5OCwiZXZlbnRJZCI6MCwiaWRlbnRpZnlJZCI6MTUsInNlcXVlbmNlTnVtYmVyIjoxNX0=',
    'IDMSESSID': '5F4F6FE688A6974A45BB5DDF724B25B1D43F9B1F2904B921CD5E4D2BB297C5AC19E573A1A6BE903A2A963193973A2681',
    'TS01b3a32b': '014b44e76b2bfffa4bf11f672f482dda08cb75db42a613534f113167d5bf454488e2a1502795632863ba48809e01be925dd9ca685b',
}

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
srcdb = "202420"
course_code = "CSCI 1300"

# Step 1: Search for CSCI 1300
search_url = "https://cab.brown.edu/api/?page=fose&route=search"
search_payload = {
    "other": { "srcdb": srcdb },
    "criteria": [
        { "field": "code", "value": course_code }
    ]
}

search_response = requests.post(search_url, headers=headers, cookies=cookies, json=search_payload)
search_response.raise_for_status()
search_data = search_response.json()

# Step 2: Extract CRN for S01 section
s01_section = next((item for item in search_data.get("results", []) if item.get("no") == "S01"), None)
if not s01_section:
    raise ValueError("Could not find S01 section for CSCI 1300 in Spring 2025")

crn = s01_section["crn"]

# Step 3: Fetch full course details using the CRN
details_url = "https://cab.brown.edu/api/?page=fose&route=details"
details_payload = {
    "srcdb": srcdb,
    "crn": crn,
    "group": f"code:{course_code}"
}

details_response = requests.post(details_url, headers=headers, cookies=cookies, json=details_payload)
details_response.raise_for_status()
details_data = details_response.json()

# Output full course detail JSON
print(json.dumps(details_data, indent=2))

test = requests.get("https://cab.brown.edu/", cookies=cookies)
print(test.status_code)
print(test.url)
