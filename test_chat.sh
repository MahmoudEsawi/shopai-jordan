#!/bin/bash
echo "Message 1..."
curl -s -X POST http://localhost:3000/api/chat \
-H "Content-Type: application/json" \
-d '{
  "message": "اغراض مشاوي ل ٥ اشخاص",
  "history": []
}' > res1.json

echo -e "\nResponse 1:"
cat res1.json | jq '.response'

echo -e "\n\nMessage 2..."
curl -s -X POST http://localhost:3000/api/chat \
-H "Content-Type: application/json" \
-d '{
  "message": "٤",
  "history": [
    {"role": "user", "content": "اغراض مشاوي ل ٥ اشخاص"},
    {"role": "assistant", "content": "كم الميزانية؟"}
  ]
}' > res2.json

echo -e "\nResponse 2:"
cat res2.json | jq '.response'
