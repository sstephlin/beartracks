import csv
import re

input_file = 'csci_prereqs_with_non_csci.csv'
output_file = 'clean_prereqs.csv'

def clean_cell(cell):
    # Matches patterns like: [{'CSCI 0111'}] or [{'CSCI 0180', 'CSCI 0190'}]
    # Removes quotes *inside* the brackets but leaves the structure [{CSCI 0111}]
    if re.match(r"^\[\{.*\}\]$", cell):
        # Remove single quotes around course codes
        return re.sub(r"'([^']+)'", r"\1", cell)
    return cell

with open(input_file, mode='r', newline='', encoding='utf-8') as infile, \
     open(output_file, mode='w', newline='', encoding='utf-8') as outfile:

    reader = csv.reader(infile)
    writer = csv.writer(outfile)

    for row in reader:
        cleaned_row = [clean_cell(cell) for cell in row]
        writer.writerow(cleaned_row)

print(f"Cleaned CSV saved to: {output_file}")
