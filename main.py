import sys
sys.path.append('/home/mutaib')
from utility_belt import dates, strings, filesystem, math_1

def main():
    # Working with dates
    date_input = input("Enter a date (YYYY-MM-DD): ")
    formatted_date = dates.format_date(date_input)
    print("Formatted Date:", formatted_date)

    date_input_1 = input("Enter another date (YYYY-MM-DD): ")
    date_difference = dates.date_diff(date_input, date_input_1)
    print("Date Difference (in days):", date_difference)

    # Manipulating strings
    string_input = input("Enter a string: ")
    words = strings.split_string(string_input, ', ')
    joined_string = strings.join_strings(words, ' & ')
    uppercase_string = strings.to_uppercase(string_input)

    print("Split String:", words)
    print("Joined String:", joined_string)
    print("Uppercase String:", uppercase_string)

    # Interacting with the filesystem
    file_name = input("Enter the name of the file to read: ")
    file_content = filesystem.read_file(file_name)
    if file_content is not None:
        print("Content of", file_name + ":", file_content)

    # Performing mathematical calculations
    num1 = float(input("Enter a number: "))
    num2 = float(input("Enter another number: "))
    result = math_1.add(num1, num2)
    random_number = math_1.generate_random_number(1, 100)

    print("Addition Result:", result)
    print("Random Number:", random_number)

if __name__ == "__main__":
    main()
