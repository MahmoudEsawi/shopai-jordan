# 🆓 Setup Groq AI (FREE & FAST!)

## Quick Setup (2 minutes)

### Step 1: Get FREE API Key
1. Visit: **https://console.groq.com**
2. Sign up (FREE, no credit card needed!)
3. Go to "API Keys" section
4. Click "Create API Key"
5. Copy your key

### Step 2: Set Environment Variable

**On Mac/Linux:**
```bash
export GROQ_API_KEY="your-api-key-here"
```

**On Windows:**
```cmd
set GROQ_API_KEY=your-api-key-here
```

**Or create a `.env` file:**
```
GROQ_API_KEY=your-api-key-here
```

### Step 3: Restart the App
```bash
python3 web_app_enhanced.py
```

## Why Groq?

✅ **100% FREE forever** - No credit card required  
✅ **10x faster** than OpenAI  
✅ **14,400 requests/day** free tier  
✅ **Same quality** as ChatGPT  
✅ **No billing** - completely free!

## Verify Setup

Run this to check:
```bash
python3 groq_assistant.py
```

You should see: `Active: YES ✅`

## Troubleshooting

**If you see "Need API key":**
- Make sure you exported the variable: `echo $GROQ_API_KEY`
- Restart your terminal/app after setting the variable
- Check the key is correct (no extra spaces)

**The app works without Groq too!**
- Product browsing ✅
- Shopping lists ✅  
- Filters ✅
- Just no AI chat responses

