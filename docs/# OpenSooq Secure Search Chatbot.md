# OpenSooq Secure Search Chatbot

![Python Version](https://img.shields.io/badge/Python-3.x-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-In_Development-orange)

## 📖 About the Project
This project is a secure chatbot designed to perform searches on the OpenSooq platform. Created by **Laith Hasan**, **Mahmoud Isawie**, and **Anas Alhadidi**, this script is part of our graduation project. It provides a secure and efficient way to search OpenSooq listings, ensuring protection against injection attacks and filtering out irrelevant or unavailable results.

The program generates a final URL for the search query, which you can click to view the results directly on OpenSooq.

---

## 🚀 Features
- **Secure Search**: Hardened against injection attacks.
- **Filtered Results**: Removes unavailable or irrelevant listings.
- **Configurable Options**: Adjust price, year, and domain constraints.
- **Final URL Output**: Provides a clickable URL for the search results.

---

## 🛠️ Installation

### Prerequisites
- Python 3.x installed on your system.
- Required Python libraries:
  - `requests`
  - `beautifulsoup4`

### Steps
1. Clone the repository or download the script:
   ```bash
   git clone https://github.com/your-repo/mikroelectron.git
   cd mikroelectron

   2.Install the required dependencies:
     pip3 install requests beautifulsoup4

  3.  export TAVILY_API_KEY='your-api-key-here'


🖥️ Usage

1.Run the script:

python3 microelectron.py

2.Enter your search query when prompted. For example:

Search query (e.g. 'Nissan Micra 2010-2014 price 1000-6000'):

The program will process your query and provide a final URL. Click the URL to view the results on OpenSooq.

⚙️ Configuration
You can customize the script by modifying the following constants in microelectron.py:

API Key: Set the TAVILY_API_KEY for authentication.
Number of Results: Change NUM_RESULTS to adjust the number of results fetched.
Price Range: Modify MAX_PRICE and MIN_PRICE for the acceptable price range.
Year Range: Adjust MAX_YEAR and MIN_YEAR for the acceptable year range.
Allowed Domains: Update ALLOWED_DOMAINS to whitelist specific domains.
🔒 Security
