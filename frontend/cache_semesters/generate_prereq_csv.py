import os
import re
import json
import csv
import time
import requests
from bs4 import BeautifulSoup

# this script is 2/2 of creating a csv with the prereqs for every CSCI course:
#
# it loops through each semester json that was cached in cache/search and then 
# sends individual api requests for each csci course to look for the "registration_restrictions"
# field in the json. It also saves each of these responses as a json insde of cache/details. 

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

semester_to_srcdb = {
    "Fall 21": "202110", "Winter 21": "202115", "Spring 22": "202120", "Summer 22": "202200",
    "Fall 22": "202210", "Winter 22": "202215", "Spring 23": "202220", "Summer 23": "202300",
    "Fall 23": "202310", "Winter 23": "202315", "Spring 24": "202320", "Summer 24": "202400",
    "Fall 24": "202410", "Winter 24": "202415", "Spring 25": "202420", "Summer 25": "202500",
    "Fall 25": "202510", "Winter 25": "202515", "Spring 26": "202520"
}

search_base_path = "cache/search"
details_base_path = "cache/details"
os.makedirs(details_base_path, exist_ok=True)

details_url = "https://cab.brown.edu/api/?page=fose&route=details"

output_rows = []
header = ["Course Code", "Course Name"] + list(semester_to_srcdb.keys())

def parse_prereq_html(html):
    '''parses JSON response from CAB for a specific course's prerequisties into the format
    [{}, {}] based on OR and AND relationships. Looks into either the 
    "registration_requirements" field in the JSON or the description to find
    the prerequisites.
    '''
    if not html or not isinstance(html, str):
        return []

    soup = BeautifulSoup(html, "html.parser")
    prereq_block = soup.find("p", class_="prereq") or soup

    prereqs = []
    current_group = []
    has_links = False
    is_concurrent = False

    for node in prereq_block.descendants:
        if isinstance(node, str):
            text = node.strip().lower()
            if 'or' in text:
                continue  # stay in the same OR group
            elif 'and' in text or '.' in text:
                if current_group:
                    prereqs.append(set(current_group))
                    current_group = []
            continue

        if node.name == "a":
            has_links = True
            code = node.get("data-group", "")
            if not code.startswith("code:"):
                continue
            code = code.replace("code:", "").strip()

            # Check for concurrency marker
            sibling = node.find_next_sibling()
            while sibling and sibling.name == "sup":
                if "*" in sibling.get_text():
                    is_concurrent = True
                sibling = sibling.find_next_sibling()

            if is_concurrent:
                code += "*"
            current_group.append(code)
            is_concurrent = False

    if current_group:
        prereqs.append(set(current_group))

    # Fallback for plain-text descriptions if no <a> tags found
    if not has_links and not prereqs:
        if "prerequisite" in html.lower():
            found_groups = re.findall(r"(CSCI|MATH|APMA|DATA|ENGN)\s?\d{4}(\*?)", html)
            codes = set()
            for subject, star in found_groups:
                course = f"{subject} {star if star else ''}".strip()
                codes.add(course)
            if codes:
                prereqs.append(codes)

    return prereqs

def fetch_course_details(crn, srcdb, course_code):
    '''loops through each course in a JSON for a semeester and sends post request 
    for each course. Calls on parse_prereq_html() to parse through the JSON
    '''

    if crn is None:
        raise ValueError(f"Missing CRN for {course_code} in {srcdb}")

    detail_path = os.path.join(details_base_path, f"{course_code.replace(' ', '_')}-{srcdb}.json")

    def should_refresh(data):
        return (
            not isinstance(data, dict)
            or "registration_restrictions" not in data
            or data["registration_restrictions"] is None
        )

    if os.path.exists(detail_path):
        with open(detail_path) as f:
            try:
                data = json.load(f)
                if not should_refresh(data):
                    return data
                else:
                    print(f"[REFETCH] {course_code} ({srcdb}) - invalid or missing prereq data")
            except json.JSONDecodeError:
                print(f"[REFETCH] {course_code} ({srcdb}) - corrupt JSON")

    # Fetch from API and overwrite cache
    payload = {
        "srcdb": srcdb,
        "crn": crn,
        "group": f"code:{course_code}"
    }
    response = requests.post(
        details_url,
        cookies=cookies,
        headers=headers,
        json=payload
    )
    response.raise_for_status()
    detail_data = response.json()

    with open(detail_path, "w") as f:
        json.dump(detail_data, f)

    time.sleep(1)  # Throttle
    return detail_data

for semester, srcdb in semester_to_srcdb.items():
    print(f"========== Processing Semester: {semester} ==========")
    filepath = f"{search_base_path}/CSCI-{srcdb}.json"
    if not os.path.exists(filepath):
        print(f"[MISSING] {filepath} not found.")
        continue

    with open(filepath) as f:
        data = json.load(f)

    course_sections = {}

    # Group all sections by course code
    for item in data.get("results", []):
        course_code = item.get("code", "").strip()
        if course_code not in course_sections:
            course_sections[course_code] = []
        course_sections[course_code].append(item)

    for course_code, sections in course_sections.items():
        
        # iterate through EACH section, and pick the first section with "no" starting with "S" 
        # (AKA lecture section) with a valid CRN
        lecture = next((sec for sec in sections if sec.get("no", "").startswith("S") and sec.get("crn")), None)
        if not lecture:
            continue

        course_title = lecture.get("title", "").strip()
        crn = lecture.get("crn")
        if not crn:
            continue

        try:
            detail_data = fetch_course_details(crn, srcdb, course_code)
            prereq_html = detail_data.get("registration_restrictions", "")

            if not prereq_html:
                desc = detail_data.get("description", "")
                if "prereq" in desc.lower():
                    prereq_html = desc
                else:
                    prereq_html = ""

            parsed_prereqs = parse_prereq_html(prereq_html)

            match = next((row for row in output_rows if row[0] == course_code), None)
            if not match:
                match = [course_code, course_title] + [""] * len(semester_to_srcdb)
                output_rows.append(match)

            idx = header.index(semester)
            match[idx] = str(parsed_prereqs)
            # match[idx] = "[" + ", ".join([str(group) for group in parsed_prereqs]) + "]" if parsed_prereqs else ""
            print(f"[OK] {course_code} ({semester}) → {parsed_prereqs}")
        except Exception as e:
            print(f"[ERROR] {course_code} ({semester}): {e}")

    print(f"✅ Finished processing semester: {semester}")

# Write to CSV
with open("csci_prereqs.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(header)
    writer.writerows(output_rows)

print("✅ CSCI prereq CSV generated: csci_prereqs.csv")