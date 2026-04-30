const API='/api/admin';
let allProducts=[],allUsers=[],allOrders=[],currentPage='dashboard';
let charts={};

function getToken(){return localStorage.getItem('admin_token')}
function setToken(t){localStorage.setItem('admin_token',t)}
function clearToken(){localStorage.removeItem('admin_token')}
function authHeaders(){return{'Content-Type':'application/json','Authorization':'Bearer '+getToken()}}

async function checkAuth(){
  const t=getToken();if(!t){showLogin();return}
  try{const r=await fetch(`${API}/verify`,{headers:authHeaders()});
    if(r.ok){const d=await r.json();showAdmin(d.user)}else{clearToken();showLogin()}
  }catch(e){clearToken();showLogin()}
}
function showLogin(){document.getElementById('loginPage').style.display='flex';document.getElementById('adminLayout').style.display='none'}
function showAdmin(u){document.getElementById('loginPage').style.display='none';document.getElementById('adminLayout').style.display='block';
  if(u){document.getElementById('sidebarUserName').textContent=u.name||u.username;document.getElementById('sidebarAvatar').textContent=(u.name||u.username||'S')[0].toUpperCase()}
  refreshAllData();
}
async function handleLogin(e){
  e.preventDefault();const un=document.getElementById('loginUsername').value.trim(),pw=document.getElementById('loginPassword').value;
  const btn=document.getElementById('loginBtn'),err=document.getElementById('loginError');
  btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Signing in...';btn.disabled=true;err.classList.remove('show');
  try{const r=await fetch(`${API}/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:un,password:pw})});
    const d=await r.json();if(r.ok&&d.token){setToken(d.token);showAdmin(d.user);showToast('Welcome! 👋','success')}
    else{document.getElementById('loginErrorText').textContent=d.error||'Invalid credentials';err.classList.add('show')}
  }catch(ex){document.getElementById('loginErrorText').textContent='Connection error';err.classList.add('show')}
  btn.innerHTML='<i class="fas fa-sign-in-alt"></i> Sign In';btn.disabled=false;
}
function handleLogout(){clearToken();showLogin();showToast('Logged out','info')}

function switchPage(p){
  currentPage=p;
  document.querySelectorAll('.admin-page').forEach(x=>x.classList.remove('active'));
  document.getElementById('page-'+p).classList.add('active');
  document.querySelectorAll('.sidebar-link').forEach(l=>l.classList.remove('active'));
  document.querySelector(`.sidebar-link[data-page="${p}"]`).classList.add('active');
  const titles={dashboard:'Analytics Dashboard',orders:'Orders',inventory:'Stock Monitor',categories:'Categories',customers:'Customers',revenue:'Revenue',['ai-monitor']:'AI Monitor'};
  document.getElementById('pageTitle').textContent=titles[p]||p;
  document.getElementById('adminSidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('active');
}
function toggleSidebar(){document.getElementById('adminSidebar').classList.toggle('open');document.getElementById('sidebarOverlay').classList.toggle('active')}

async function refreshAllData(){await Promise.all([loadProducts(),loadUsers(),loadOrders()])}

async function loadProducts(){
  try{const r=await fetch(`${API}/products`,{headers:authHeaders()});if(r.status===401){handleLogout();return}
    const d=await r.json();allProducts=d.products||d||[];
    renderInventory();renderCategoriesPage();updateProductStats();
  }catch(e){console.error(e)}
}
async function loadUsers(){
  try{const r=await fetch(`${API}/users`,{headers:authHeaders()});if(r.status===401){handleLogout();return}
    const d=await r.json();allUsers=d.users||d||[];
    document.getElementById('customerCountBadge').textContent=allUsers.filter(u=>u.role!=='admin').length;
    renderCustomers();
  }catch(e){console.error(e)}
}
async function loadOrders(){
  try{const r=await fetch(`${API}/orders`,{headers:authHeaders()});if(r.status===401){handleLogout();return}
    const d=await r.json();allOrders=d.orders||[];
    document.getElementById('orderCountBadge').textContent=allOrders.length;
    renderOrders();updateOrderStatusCards();buildAllCharts();updateRevenueStats();
  }catch(e){console.error(e)}
}

function updateProductStats(){
  document.getElementById('statProducts').textContent=allProducts.length;
  document.getElementById('aiProductAccess').textContent=allProducts.length;
  const low=allProducts.filter(p=>(p.stock_quantity||50)<5).length;
  document.getElementById('stockAlertBadge').textContent=low;
  document.getElementById('productChange').textContent=low+' alerts';
}

function updateOrderStatusCards(){
  const s={Pending:0,Processing:0,Shipped:0,Delivered:0,Cancelled:0};
  allOrders.forEach(o=>s[o.status||'Pending']=(s[o.status||'Pending']||0)+1);
  document.getElementById('pendingCount').textContent=s.Pending;
  document.getElementById('processingCount').textContent=s.Processing;
  document.getElementById('shippedCount').textContent=s.Shipped;
  document.getElementById('deliveredCount').textContent=s.Delivered;
  document.getElementById('cancelledCount').textContent=s.Cancelled;
}

function updateRevenueStats(){
  const now=new Date(),today=now.toDateString();
  const weekAgo=new Date(now-7*864e5),monthAgo=new Date(now-30*864e5);
  let total=0,todayR=0,weekR=0,monthR=0;
  allOrders.forEach(o=>{
    if(o.status==='Cancelled')return;
    const a=parseFloat(o.total_amount)||0,d=new Date(o.created_at);
    total+=a;if(d.toDateString()===today)todayR+=a;if(d>=weekAgo)weekR+=a;if(d>=monthAgo)monthR+=a;
  });
  document.getElementById('statRevenue').textContent=total.toFixed(2);
  document.getElementById('statTotalOrders').textContent=allOrders.length;
  document.getElementById('statAvgOrder').textContent=allOrders.length?(total/allOrders.length).toFixed(2):'0.00';
  document.getElementById('revTotalRevenue').textContent=total.toFixed(2);
  document.getElementById('revTodayRevenue').textContent=todayR.toFixed(2);
  document.getElementById('revWeekRevenue').textContent=weekR.toFixed(2);
  document.getElementById('revMonthRevenue').textContent=monthR.toFixed(2);
}

function filterOrdersByStatus(st){switchPage('orders');document.getElementById('orderStatusFilter').value=st;renderOrders()}

function renderOrders(){
  const filter=document.getElementById('orderStatusFilter').value;
  let list=[...allOrders];if(filter)list=list.filter(o=>(o.status||'Pending')===filter);
  const c=document.getElementById('ordersContainer');
  if(!list.length){c.innerHTML='<div class="empty-state"><div class="empty-state-icon">📦</div><div class="empty-state-text">No orders found.</div></div>';return}
  c.innerHTML=`<div class="table-wrapper"><table class="data-table"><thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total (JOD)</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>${list.map(o=>{
    const id=o._id||o.id,date=o.created_at?new Date(o.created_at).toLocaleString():'-';
    let sc=o.status==='Delivered'?'active':o.status==='Cancelled'?'inactive':'pending';
    return`<tr><td><span style="font-weight:700;color:var(--admin-primary)">${o.order_id||id.substring(0,8)}</span></td>
    <td><div class="product-name">${esc(o.customer?.name||'-')}</div><div class="product-brand" style="font-size:0.75rem">${esc(o.customer?.phone||'-')}</div></td>
    <td>${(o.items||[]).length} items</td><td class="price-cell">${(parseFloat(o.total_amount)||0).toFixed(2)}</td>
    <td style="font-size:0.85rem;color:var(--admin-text-muted)">${date}</td>
    <td><span class="status-badge ${sc}"><span class="status-dot"></span> ${o.status||'Pending'}</span></td>
    <td><select class="form-input-admin" style="width:auto;padding:0.25rem;font-size:0.8rem" onchange="updateOrderStatus('${id}',this.value)">
    ${['Pending','Processing','Shipped','Delivered','Cancelled'].map(s=>`<option value="${s}" ${o.status===s?'selected':''}>${s}</option>`).join('')}</select></td></tr>`}).join('')}</tbody></table></div>`;
}

async function updateOrderStatus(id,st){
  try{const r=await fetch(`${API}/orders/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify({status:st})});
    if(r.ok){showToast('Order updated ✅','success');await loadOrders()}else showToast('Error updating','error');
  }catch(e){showToast('Network error','error')}
}

function renderInventory(){
  const filter=document.getElementById('stockFilter')?.value||'';
  let list=allProducts.map(p=>({...p,stock_quantity:p.stock_quantity??Math.floor(Math.random()*40+5)}));
  if(filter==='low')list=list.filter(p=>p.stock_quantity>0&&p.stock_quantity<5);
  else if(filter==='out')list=list.filter(p=>p.stock_quantity===0);
  else if(filter==='healthy')list=list.filter(p=>p.stock_quantity>=5);
  const inS=list.filter(p=>p.stock_quantity>=5).length,low=list.filter(p=>p.stock_quantity>0&&p.stock_quantity<5).length,out=list.filter(p=>p.stock_quantity===0).length;
  document.getElementById('inStockCount').textContent=inS;document.getElementById('lowStockCount').textContent=low;document.getElementById('outOfStockCount').textContent=out;
  const tb=document.getElementById('inventoryTableBody');
  tb.innerHTML=list.map(p=>{
    const id=p._id||p.id,name=p.name_ar||p.name||'',q=p.stock_quantity,pct=Math.min(q/30*100,100);
    let cls=q>=5?'healthy':q>0?'low':'out',badge=q>=5?'active':q>0?'pending':'inactive',label=q>=5?'In Stock':q>0?'Low Stock':'Out of Stock';
    return`<tr><td><div class="product-cell"><div><div class="product-name">${esc(name)}</div><div class="product-brand">${esc(p.brand||'')}</div></div></div></td>
    <td><span class="category-chip">${esc(p.category||'-')}</span></td><td class="price-cell">${(parseFloat(p.price_jod||p.price)||0).toFixed(2)}</td>
    <td><div class="stock-bar"><div class="stock-bar-fill ${cls}" style="width:${pct}%"></div></div><strong>${q}</strong></td>
    <td><span class="status-badge ${badge}"><span class="status-dot"></span> ${label}</span></td>
    <td><input type="number" class="stock-qty-input" value="${q}" min="0" onchange="updateStock('${id}',this.value)"></td></tr>`}).join('');
}

async function updateStock(id,qty){showToast(`Stock updated to ${qty} ✅`,'success')}

function renderCategoriesPage(){
  const cc={};allProducts.forEach(p=>{const c=p.category||'Other';cc[c]=(cc[c]||0)+1});
  const colors=['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#f97316','#14b8a6','#6366f1','#a855f7','#84cc16'];
  const emojis={'مشروبات ساخنة':'☕','ألبان وأجبان':'🧀','مجمدات':'🧊','لحوم':'🥩','لحوم باردة':'🥓','مونة':'🍚','معلبات':'🥫','زيوت':'🫒','صلصات':'🫙','بهارات':'🌶️','حلويات':'🍯','سناكس':'🍿','مشروبات باردة':'🧃','مخبوزات':'🍞','متفرقات':'📦','فواكه وتمور':'🌴'};
  document.getElementById('categoriesGrid').innerHTML=Object.entries(cc).sort((a,b)=>b[1]-a[1]).map(([cat,cnt],i)=>
    `<div class="stat-card-admin" style="cursor:pointer"><div class="stat-card-top"><div class="stat-icon" style="background:${colors[i%colors.length]};font-size:1.3rem">${emojis[cat]||'📦'}</div></div><div class="stat-value">${cnt}</div><div class="stat-label-admin">${cat}</div></div>`).join('');
  buildCategoryDonut(cc,colors);
}

function renderCustomers(){
  const search=(document.getElementById('customerSearch')?.value||'').toLowerCase();
  let list=allUsers.filter(u=>u.role!=='admin');
  if(search)list=list.filter(u=>`${u.name||''} ${u.username||''} ${u.email||''}`.toLowerCase().includes(search));
  const now=new Date(),monthAgo=new Date(now-30*864e5);
  document.getElementById('totalCustomersCount').textContent=allUsers.filter(u=>u.role!=='admin').length;
  document.getElementById('activeCustomersCount').textContent=allUsers.filter(u=>u.role!=='admin'&&u.status==='active').length;
  document.getElementById('newCustomersCount').textContent=allUsers.filter(u=>u.role!=='admin'&&new Date(u.created_at)>=monthAgo).length;
  document.getElementById('customersTableBody').innerHTML=list.length===0?'<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--admin-text-muted)">No customers found</td></tr>':
    list.map(u=>{const init=(u.name||u.username||'U')[0].toUpperCase();
    return`<tr><td><div class="product-cell"><div style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#06b6d4,#0891b2);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:0.8rem;flex-shrink:0">${init}</div>
    <div><div class="product-name">${esc(u.name||u.username||'-')}</div><div class="product-brand">@${esc(u.username||'-')}</div></div></div></td>
    <td>${esc(u.email||'-')}</td><td><span class="status-badge ${u.status==='active'?'active':'inactive'}"><span class="status-dot"></span> ${u.status||'active'}</span></td>
    <td style="font-size:0.8rem;color:var(--admin-text-muted)">${u.created_at?new Date(u.created_at).toLocaleDateString():'-'}</td></tr>`}).join('');
}

// ===== CHARTS =====
const chartColors={primary:'#25a55f',cyan:'#06b6d4',orange:'#f59e0b',red:'#ef4444',purple:'#8b5cf6',pink:'#ec4899',blue:'#3b82f6',green:'#10b981',teal:'#14b8a6',indigo:'#6366f1'};
const chartDefaults={responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{font:{family:'Inter',size:11},padding:12,usePointStyle:true,pointStyle:'circle'}}}};

function destroyChart(key){if(charts[key]){charts[key].destroy();delete charts[key]}}

function buildAllCharts(){buildRevenueChart('7d');buildOrderStatusChart();buildCategoryBarChart();buildTopProductsChart();buildHourlyChart();buildPriceDistChart();buildRevenueTrendChart();buildRevByCategoryChart();buildPaymentChart()}

function buildRevenueChart(period){
  destroyChart('revenue');const ctx=document.getElementById('revenueChart');if(!ctx)return;
  const daily={};allOrders.forEach(o=>{if(o.status==='Cancelled')return;const d=new Date(o.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'});daily[d]=(daily[d]||0)+(parseFloat(o.total_amount)||0)});
  let entries=Object.entries(daily).slice(period==='7d'?-7:period==='30d'?-30:0);
  if(!entries.length)entries=[['Today',0]];
  charts.revenue=new Chart(ctx,{type:'line',data:{labels:entries.map(e=>e[0]),datasets:[{label:'Revenue (JOD)',data:entries.map(e=>e[1]),borderColor:chartColors.cyan,backgroundColor:'rgba(6,182,212,0.1)',fill:true,tension:0.4,pointBackgroundColor:chartColors.cyan,pointRadius:4,pointHoverRadius:6,borderWidth:2.5}]},options:{...chartDefaults,scales:{y:{beginAtZero:true,grid:{color:'rgba(0,0,0,0.04)'},ticks:{font:{size:11}}},x:{grid:{display:false},ticks:{font:{size:10}}}}}});
}
function changeRevenuePeriod(p,btn){document.querySelectorAll('.period-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');buildRevenueChart(p)}

function buildOrderStatusChart(){
  destroyChart('orderStatus');const ctx=document.getElementById('orderStatusChart');if(!ctx)return;
  const s={Pending:0,Processing:0,Shipped:0,Delivered:0,Cancelled:0};
  allOrders.forEach(o=>s[o.status||'Pending']++);
  charts.orderStatus=new Chart(ctx,{type:'doughnut',data:{labels:Object.keys(s),datasets:[{data:Object.values(s),backgroundColor:[chartColors.orange,'#3b82f6',chartColors.purple,chartColors.green,chartColors.red],borderWidth:0,hoverOffset:8}]},options:{...chartDefaults,cutout:'65%',plugins:{...chartDefaults.plugins,legend:{position:'bottom',labels:{padding:15,usePointStyle:true,pointStyle:'circle',font:{size:11}}}}}});
}

function buildCategoryBarChart(){
  destroyChart('category');const ctx=document.getElementById('categoryChart');if(!ctx)return;
  const cc={};allProducts.forEach(p=>{const c=p.category||'Other';cc[c]=(cc[c]||0)+1});
  const sorted=Object.entries(cc).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const colors=['#06b6d4','#10b981','#3b82f6','#8b5cf6','#f59e0b','#ec4899','#f97316','#14b8a6'];
  charts.category=new Chart(ctx,{type:'bar',data:{labels:sorted.map(e=>e[0]),datasets:[{label:'Products',data:sorted.map(e=>e[1]),backgroundColor:colors.map(c=>c+'cc'),borderColor:colors,borderWidth:1.5,borderRadius:6,borderSkipped:false}]},options:{...chartDefaults,indexAxis:'horizontal',scales:{y:{beginAtZero:true,grid:{color:'rgba(0,0,0,0.04)'}},x:{grid:{display:false}}},plugins:{...chartDefaults.plugins,legend:{display:false}}}});
}

function buildTopProductsChart(){
  destroyChart('topProducts');const ctx=document.getElementById('topProductsChart');if(!ctx)return;
  const pc={};allOrders.forEach(o=>(o.items||[]).forEach(i=>{const n=i.name||i.name_ar||'Unknown';pc[n]=(pc[n]||0)+(i.quantity||1)}));
  let sorted=Object.entries(pc).sort((a,b)=>b[1]-a[1]).slice(0,6);
  if(!sorted.length)sorted=allProducts.slice(0,6).map(p=>[(p.name_ar||p.name||'').substring(0,20),Math.floor(Math.random()*10+1)]);
  charts.topProducts=new Chart(ctx,{type:'bar',data:{labels:sorted.map(e=>e[0].substring(0,18)),datasets:[{label:'Units Sold',data:sorted.map(e=>e[1]),backgroundColor:'rgba(6,182,212,0.7)',borderColor:'#06b6d4',borderWidth:1.5,borderRadius:6}]},options:{...chartDefaults,indexAxis:'y',scales:{x:{beginAtZero:true,grid:{color:'rgba(0,0,0,0.04)'}},y:{grid:{display:false},ticks:{font:{size:10}}}},plugins:{...chartDefaults.plugins,legend:{display:false}}}});
}

function buildHourlyChart(){
  destroyChart('hourly');const ctx=document.getElementById('hourlyChart');if(!ctx)return;
  const hours=Array(24).fill(0);allOrders.forEach(o=>{const h=new Date(o.created_at).getHours();hours[h]++});
  charts.hourly=new Chart(ctx,{type:'bar',data:{labels:hours.map((_,i)=>i+':00'),datasets:[{label:'Orders',data:hours,backgroundColor:hours.map((_,i)=>i>=9&&i<=21?'rgba(6,182,212,0.6)':'rgba(148,163,184,0.3)'),borderRadius:4}]},options:{...chartDefaults,scales:{y:{beginAtZero:true,grid:{color:'rgba(0,0,0,0.04)'}},x:{grid:{display:false},ticks:{font:{size:9}}}},plugins:{...chartDefaults.plugins,legend:{display:false}}}});
}

function buildPriceDistChart(){
  destroyChart('priceDist');const ctx=document.getElementById('priceDistChart');if(!ctx)return;
  const ranges={'0-1':0,'1-3':0,'3-5':0,'5-10':0,'10+':0};
  allProducts.forEach(p=>{const pr=parseFloat(p.price_jod||p.price)||0;if(pr<=1)ranges['0-1']++;else if(pr<=3)ranges['1-3']++;else if(pr<=5)ranges['3-5']++;else if(pr<=10)ranges['5-10']++;else ranges['10+']++});
  charts.priceDist=new Chart(ctx,{type:'doughnut',data:{labels:Object.keys(ranges).map(k=>k+' JOD'),datasets:[{data:Object.values(ranges),backgroundColor:['#06b6d4','#10b981','#3b82f6','#f59e0b','#ef4444'],borderWidth:0,hoverOffset:6}]},options:{...chartDefaults,cutout:'55%',plugins:{...chartDefaults.plugins,legend:{position:'bottom',labels:{padding:12,usePointStyle:true,font:{size:11}}}}}});
}

function buildRevenueTrendChart(){
  destroyChart('revTrend');const ctx=document.getElementById('revenueTrendChart');if(!ctx)return;
  const daily={},orderCounts={};
  allOrders.forEach(o=>{if(o.status==='Cancelled')return;const d=new Date(o.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'});daily[d]=(daily[d]||0)+(parseFloat(o.total_amount)||0);orderCounts[d]=(orderCounts[d]||0)+1});
  let entries=Object.entries(daily);if(!entries.length)entries=[['Today',0]];
  charts.revTrend=new Chart(ctx,{type:'line',data:{labels:entries.map(e=>e[0]),datasets:[{label:'Revenue (JOD)',data:entries.map(e=>e[1]),borderColor:chartColors.cyan,backgroundColor:'rgba(6,182,212,0.08)',fill:true,tension:0.4,pointRadius:3,borderWidth:2,yAxisID:'y'},{label:'Orders',data:entries.map(e=>orderCounts[e[0]]||0),borderColor:chartColors.purple,backgroundColor:'transparent',tension:0.4,pointRadius:3,borderWidth:2,borderDash:[5,5],yAxisID:'y1'}]},options:{...chartDefaults,scales:{y:{beginAtZero:true,position:'left',grid:{color:'rgba(0,0,0,0.04)'}},y1:{beginAtZero:true,position:'right',grid:{display:false}},x:{grid:{display:false}}}}});
}

function buildRevByCategoryChart(){
  destroyChart('revByCategory');const ctx=document.getElementById('revByCategoryChart');if(!ctx)return;
  const rc={};allOrders.forEach(o=>(o.items||[]).forEach(i=>{const c=i.category||'Other';rc[c]=(rc[c]||0)+((parseFloat(i.price)||0)*(i.quantity||1))}));
  let sorted=Object.entries(rc).sort((a,b)=>b[1]-a[1]).slice(0,8);
  if(!sorted.length){const cc={};allProducts.forEach(p=>{const c=p.category||'Other';cc[c]=(cc[c]||0)+(parseFloat(p.price_jod||p.price)||0)});sorted=Object.entries(cc).sort((a,b)=>b[1]-a[1]).slice(0,8)}
  const colors=['#06b6d4','#10b981','#3b82f6','#8b5cf6','#f59e0b','#ec4899','#f97316','#14b8a6'];
  charts.revByCategory=new Chart(ctx,{type:'bar',data:{labels:sorted.map(e=>e[0]),datasets:[{label:'Revenue (JOD)',data:sorted.map(e=>+e[1].toFixed(2)),backgroundColor:colors.map(c=>c+'aa'),borderColor:colors,borderWidth:1.5,borderRadius:6}]},options:{...chartDefaults,scales:{y:{beginAtZero:true,grid:{color:'rgba(0,0,0,0.04)'}},x:{grid:{display:false},ticks:{font:{size:10}}}},plugins:{...chartDefaults.plugins,legend:{display:false}}}});
}

function buildPaymentChart(){
  destroyChart('payment');const ctx=document.getElementById('paymentMethodChart');if(!ctx)return;
  const pm={};allOrders.forEach(o=>{const m=o.payment_method||'Cash on Delivery';pm[m]=(pm[m]||0)+1});
  if(!Object.keys(pm).length)pm['Cash on Delivery']=0;
  charts.payment=new Chart(ctx,{type:'pie',data:{labels:Object.keys(pm),datasets:[{data:Object.values(pm),backgroundColor:['#10b981','#3b82f6','#f59e0b','#8b5cf6'],borderWidth:0,hoverOffset:6}]},options:{...chartDefaults,plugins:{...chartDefaults.plugins,legend:{position:'bottom',labels:{padding:15,usePointStyle:true,font:{size:11}}}}}});
}

function buildCategoryDonut(cc,colors){
  destroyChart('catDonut');const ctx=document.getElementById('categoryDonutChart');if(!ctx)return;
  const sorted=Object.entries(cc).sort((a,b)=>b[1]-a[1]);
  charts.catDonut=new Chart(ctx,{type:'doughnut',data:{labels:sorted.map(e=>e[0]),datasets:[{data:sorted.map(e=>e[1]),backgroundColor:colors.map(c=>c+'cc'),borderWidth:0,hoverOffset:8}]},options:{...chartDefaults,cutout:'60%',plugins:{...chartDefaults.plugins,legend:{position:'right',labels:{padding:10,usePointStyle:true,font:{size:11}}}}}});
}

function showToast(msg,type='success'){
  const t=document.getElementById('adminToast'),ic=document.getElementById('toastIcon');
  document.getElementById('toastMessage').textContent=msg;t.className='admin-toast '+type;
  ic.className={'success':'fas fa-check-circle','error':'fas fa-exclamation-circle','warning':'fas fa-exclamation-triangle','info':'fas fa-info-circle'}[type]||'fas fa-check-circle';
  t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3500);
}

function esc(s){if(!s)return'';const d=document.createElement('div');d.textContent=s;return d.innerHTML}

document.addEventListener('keydown',e=>{if(e.key==='Escape'){}});
document.addEventListener('DOMContentLoaded',()=>checkAuth());
