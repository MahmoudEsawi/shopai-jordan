# 🧪 Testing Guide - New Talabat Features

## 🆕 What's New?

### 1. **Orders System** 🛒
- Create orders from your shopping cart
- View order history
- Track order status
- Get detailed order information

### 2. **Address Management** 📍
- Save multiple shipping addresses
- Set default address
- Add, edit, delete addresses

### 3. **Delivery Methods** 🚚
- Standard Delivery (2-3 days, 2 JOD)
- Express Delivery (Same day, 5 JOD)
- Store Pickup (Free)

### 4. **Payment Integration** 💳
- Stripe payment processing
- Payment intent creation
- Webhook handling

---

## 🚀 Quick Start Testing

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Start the Server
```bash
python3 web_app_enhanced.py
```

The server will start on `http://localhost:8080`

---

## 📝 Testing Each Feature

### Test 1: Address Management

#### 1.1 Sign In
1. Go to `http://localhost:8080/auth`
2. Sign in with your account (or create one)

#### 1.2 Add an Address (Using Browser Console)
Open browser console (F12) and run:

```javascript
// Get your user ID from localStorage
const userId = localStorage.getItem('user_id');

// Add a new address
fetch('/api/addresses', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userId
    },
    body: JSON.stringify({
        first_name: 'John',
        last_name: 'Doe',
        street: '123 Main Street',
        city: 'Amman',
        country: 'Jordan',
        postal_code: '11118',
        phone_number: '+962791234567',
        is_default: true
    })
})
.then(r => r.json())
.then(data => console.log('Address added:', data));
```

#### 1.3 Get All Addresses
```javascript
fetch('/api/addresses', {
    headers: {
        'X-User-ID': localStorage.getItem('user_id')
    }
})
.then(r => r.json())
.then(data => console.log('My addresses:', data));
```

#### 1.4 Get Default Address
```javascript
fetch('/api/addresses/default', {
    headers: {
        'X-User-ID': localStorage.getItem('user_id')
    }
})
.then(r => r.json())
.then(data => console.log('Default address:', data));
```

---

### Test 2: Delivery Methods

#### 2.1 Get Available Delivery Methods
```javascript
fetch('/api/orders/delivery-methods')
.then(r => r.json())
.then(data => console.log('Delivery methods:', data));
```

Expected response:
```json
{
  "success": true,
  "delivery_methods": [
    {
      "id": 1,
      "name": "Standard Delivery",
      "description": "2-3 business days",
      "price": 2.0,
      "estimated_days": 3
    },
    {
      "id": 2,
      "name": "Express Delivery",
      "description": "Same day delivery",
      "price": 5.0,
      "estimated_days": 1
    },
    {
      "id": 3,
      "name": "Store Pickup",
      "description": "Pick up from store",
      "price": 0.0,
      "estimated_days": 0
    }
  ]
}
```

---

### Test 3: Create an Order

#### 3.1 Add Items to Cart First
1. Go to the home page
2. Use the chat or browse products
3. Add some items to your cart

#### 3.2 Create Order from Cart
```javascript
const userId = localStorage.getItem('user_id');
const sessionId = 'test-session'; // Or get from your session

fetch('/api/orders', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userId,
        'X-Session-ID': sessionId
    },
    body: JSON.stringify({
        delivery_method_id: 1, // Standard Delivery
        shipping_address: {
            first_name: 'John',
            last_name: 'Doe',
            street: '123 Main Street',
            city: 'Amman',
            country: 'Jordan'
        }
    })
})
.then(r => r.json())
.then(data => {
    console.log('Order created:', data);
    // Save order ID for later
    if (data.success) {
        localStorage.setItem('last_order_id', data.order.id);
    }
});
```

Expected response:
```json
{
  "success": true,
  "order": {
    "id": 1,
    "user_id": 1,
    "order_number": "ORD-20241122-1-143022",
    "status": "Pending",
    "subtotal": 25.50,
    "delivery_fee": 2.0,
    "total": 27.50,
    "delivery_method_id": 1,
    "items": [
      {
        "id": 1,
        "product_id": "product-123",
        "product_name": "Chicken Breast",
        "price": 12.50,
        "quantity": 2,
        "subtotal": 25.00
      }
    ],
    "shipping_address": {
      "first_name": "John",
      "last_name": "Doe",
      "street": "123 Main Street",
      "city": "Amman",
      "country": "Jordan"
    }
  }
}
```

---

### Test 4: View Order History

#### 4.1 Get All Orders
```javascript
fetch('/api/orders', {
    headers: {
        'X-User-ID': localStorage.getItem('user_id')
    }
})
.then(r => r.json())
.then(data => console.log('Order history:', data));
```

#### 4.2 Get Specific Order
```javascript
const orderId = localStorage.getItem('last_order_id') || 1;

fetch(`/api/orders/${orderId}`, {
    headers: {
        'X-User-ID': localStorage.getItem('user_id')
    }
})
.then(r => r.json())
.then(data => console.log('Order details:', data));
```

---

### Test 5: Payment Integration (Stripe)

#### 5.1 Setup Stripe (Optional)
```bash
# Set your Stripe test key
export STRIPE_SECRET_KEY="sk_test_..."
```

#### 5.2 Create Payment Intent
```javascript
const userId = localStorage.getItem('user_id');
const sessionId = 'test-session';

fetch('/api/payments/intent?basketId=cart123', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userId,
        'X-Session-ID': sessionId
    },
    body: JSON.stringify({
        delivery_method_id: 1
    })
})
.then(r => r.json())
.then(data => {
    console.log('Payment intent:', data);
    if (data.success) {
        console.log('Client secret:', data.client_secret);
        console.log('Payment intent ID:', data.payment_intent_id);
    }
});
```

**Note:** For full payment testing, you'll need:
1. Stripe account (test mode)
2. Frontend integration with Stripe.js
3. Webhook endpoint configured

---

## 🧪 Complete Test Flow

### Full E-commerce Flow Test:

1. **Sign In** → Get user ID
2. **Add Address** → Save shipping address
3. **Browse Products** → Add items to cart
4. **Get Delivery Methods** → Choose delivery option
5. **Create Payment Intent** → (Optional, requires Stripe)
6. **Create Order** → Convert cart to order
7. **View Order History** → See all your orders
8. **Get Order Details** → View specific order

---

## 🔍 Testing with Postman/Thunder Client

### Collection Setup:

1. **Base URL**: `http://localhost:8080`
2. **Required Headers**:
   - `Content-Type: application/json`
   - `X-User-ID: <your_user_id>` (for authenticated endpoints)

### Test Requests:

#### 1. Get Delivery Methods
```
GET http://localhost:8080/api/orders/delivery-methods
```

#### 2. Add Address
```
POST http://localhost:8080/api/addresses
Headers:
  X-User-ID: 1
Body:
{
  "first_name": "John",
  "last_name": "Doe",
  "street": "123 Main St",
  "city": "Amman",
  "country": "Jordan",
  "is_default": true
}
```

#### 3. Get Addresses
```
GET http://localhost:8080/api/addresses
Headers:
  X-User-ID: 1
```

#### 4. Create Order
```
POST http://localhost:8080/api/orders
Headers:
  X-User-ID: 1
  X-Session-ID: test-session
Body:
{
  "delivery_method_id": 1,
  "shipping_address": {
    "first_name": "John",
    "last_name": "Doe",
    "street": "123 Main St",
    "city": "Amman",
    "country": "Jordan"
  }
}
```

#### 5. Get Orders
```
GET http://localhost:8080/api/orders
Headers:
  X-User-ID: 1
```

---

## 🐛 Troubleshooting

### Issue: "Authentication required"
**Solution**: Make sure you're signed in and passing `X-User-ID` header

### Issue: "Cart is empty"
**Solution**: Add items to cart first using the chat or product browser

### Issue: "Order not found"
**Solution**: Check that the order ID exists and belongs to your user

### Issue: Stripe errors
**Solution**: 
- Make sure `STRIPE_SECRET_KEY` is set (optional)
- Payment features work without Stripe, but payment processing won't work

---

## 📊 Expected Database Changes

After testing, you should see new tables in `users.db`:
- `orders` - All orders
- `order_items` - Items in each order
- `delivery_methods` - Delivery options
- `user_addresses` - User addresses

---

## ✅ Quick Verification

Run this in browser console to verify everything works:

```javascript
async function testAll() {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
        console.error('Please sign in first!');
        return;
    }
    
    console.log('🧪 Testing all new features...\n');
    
    // Test 1: Delivery Methods
    const dm = await fetch('/api/orders/delivery-methods').then(r => r.json());
    console.log('✅ Delivery Methods:', dm.success ? 'Working' : 'Failed');
    
    // Test 2: Addresses
    const addr = await fetch('/api/addresses', {
        headers: { 'X-User-ID': userId }
    }).then(r => r.json());
    console.log('✅ Addresses:', addr.success ? 'Working' : 'Failed');
    
    // Test 3: Orders
    const orders = await fetch('/api/orders', {
        headers: { 'X-User-ID': userId }
    }).then(r => r.json());
    console.log('✅ Orders:', orders.success ? 'Working' : 'Failed');
    
    console.log('\n🎉 All tests complete!');
}

testAll();
```

---

## 🎯 Next Steps

1. **Frontend Integration**: Create UI for checkout, order history, address management
2. **Stripe Integration**: Add payment form using Stripe.js
3. **Email Notifications**: Send order confirmation emails
4. **Order Status Updates**: Add admin panel to update order status

---

**Happy Testing! 🚀**

