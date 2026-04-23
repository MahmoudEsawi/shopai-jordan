with open('server.js', 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1
insert_idx = -1

for i, line in enumerate(lines):
    if '// 🟢🟢🟢 NEW GEMINI AI IMPLEMENTATION' in line and start_idx == -1:
        start_idx = i
    if '// 🟢🟢🟢 END OF NEW GEMINI AI IMPLEMENTATION' in line and start_idx != -1 and end_idx == -1:
        end_idx = i
    if 'res.json({' in line and i+1 < len(lines) and 'response: aiResponse' in lines[i+1]:
        insert_idx = i

if start_idx != -1 and end_idx != -1 and insert_idx != -1:
    block = lines[start_idx:end_idx+1]
    
    # Modify the block to use listItems instead of products
    new_block = []
    skip_lines = 0
    for i, line in enumerate(block):
        if skip_lines > 0:
            skip_lines -= 1
            continue
            
        if 'const productsListText = products.map(p =>' in line:
            new_block.append('            // Use the generated shopping list items if available, otherwise fallback to relevantProducts or all products\n')
            new_block.append('            const itemsToUse = (typeof listItems !== "undefined" && listItems.length > 0) ? listItems : (relevantProducts && relevantProducts.length > 0 ? relevantProducts : products);\n')
            new_block.append('            const productsListText = itemsToUse.map(p =>\n')
            new_block.append('                `- ${p.name_ar || p.name} (${p.category || "عام"}): ${p.unit_price || p.price_jod || p.price} JOD${p.quantity ? ` (Quantity: ${p.quantity})` : ""}`\n')
            new_block.append('            ).join("\\n");\n')
            skip_lines = 2 # skip the next two lines which are the old map body and join
        elif 'AVAILABLE PRODUCTS IN OUR STORE' in line:
            new_block.append('SELECTED ITEMS FOR THE USER\'S CART (You MUST ONLY summarize these exact items in your response because they are what will actually be added to the user\'s cart based on our smart budget system):\n')
        else:
            new_block.append(line)
            
    # Remove block
    del lines[start_idx:end_idx+1]
    
    # Recalculate insert_idx
    for i, line in enumerate(lines):
        if 'res.json({' in line and i+1 < len(lines) and 'response: aiResponse' in lines[i+1]:
            insert_idx = i
            break
            
    # Insert block
    lines.insert(insert_idx, "".join(new_block) + "\n")
    
    with open('server.js', 'w') as f:
        f.writelines(lines)
    print("Success")
else:
    print(f"Failed to find indices: start={start_idx}, end={end_idx}, insert={insert_idx}")
