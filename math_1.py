import math
import random

def add(x, y):
    """Adds two numbers."""
    return x + y

def subtract(x, y):
    """Subtracts one number from another."""
    return x - y

def multiply(x, y):
    """Multiplies two numbers."""
    return x * y

def divide(x, y):
    """Divides one number by another."""
    if y == 0:
        raise ValueError("Cannot divide by zero")
    return x / y

def square_root(x):
    """Calculates the square root of a number."""
    return math.sqrt(x)

def factorial(x):
    """Calculates the factorial of a number."""
    return math.factorial(x)

def min_value(numbers):
    """Finds the minimum value in a list of numbers."""
    return min(numbers)

def max_value(numbers):
    """Finds the maximum value in a list of numbers."""
    return max(numbers)

def round_number(x, decimals=0):
    """Rounds a number to a specified number of decimal places."""
    return round(x, decimals)

def generate_random_number(min_val=0, max_val=100):
    """Generates a random number within a specified range."""
    return random.randint(min_val, max_val)
