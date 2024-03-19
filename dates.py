import datetime
import pytz

def format_date(date, format='%Y-%m-%d'):
    """Formats a date object or string."""
    if isinstance(date, str):
        date = datetime.datetime.strptime(date, '%Y-%m-%d')
    return date.strftime(format)

def date_diff(date1, date2):
    """Calculates the difference in days between two dates."""
    if isinstance(date1, str):
        date1 = datetime.datetime.strptime(date1, '%Y-%m-%d')
    if isinstance(date2, str):
        date2 = datetime.datetime.strptime(date2, '%Y-%m-%d')
    return abs((date2 - date1).days)

def parse_date(date_string, format='%Y-%m-%d'):
    """Parses a date string into a datetime object."""
    return datetime.datetime.strptime(date_string, format)

def convert_timezone(date, from_timezone='UTC', to_timezone='UTC'):
    """Converts a datetime object to a different timezone."""
    from_tz = pytz.timezone(from_timezone)
    to_tz = pytz.timezone(to_timezone)
    if isinstance(date, str):
        date = datetime.datetime.strptime(date, '%Y-%m-%d %H:%M:%S')
    localized_date = from_tz.localize(date)
    return localized_date.astimezone(to_tz)
