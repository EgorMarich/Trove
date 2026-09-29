<template>
  <MarketingList title="Контент" eyebrow="CONTENT ENGINE">
    <div class="content-page">
      <section class="composer">
        <div><span class="eyebrow">AI CONTENT ENGINE</span><h2>Создаём контент из реального спроса</h2><p>Точки роста строятся из поисков, просмотров и интереса к направлениям. Можно сразу создать draft и отправить его на review.</p></div>
        <textarea v-model="brief" placeholder="Например: сделай SEO-гид по Анталье для семейного отдыха"></textarea>
        <button :disabled="loading" @click="analyze">{{ loading ? 'Анализирую…' : 'Найти возможности' }}</button>
      </section>

      <section class="section">
        <div class="section-head"><div><span class="eyebrow">DEMAND SIGNALS</span><h3>Что стоит создать</h3></div></div>
        <div class="ideas"><article v-for="item in opportunities" :key="item.title" class="card"><div class="top"><span class="type">{{ item.type }}</span><span class="priority" :class="item.priority">{{ item.priority === 'high' ? 'HIGH' : 'MEDIUM' }}</span></div><h4>{{ item.title }}</h4><p>{{ item.reason }}</p><button @click="generate(item)">Создать draft →</button></article></div>
      </section>

      <section class="section" v-if="items.length">
        <div class="section-head"><div><span class="eyebrow">CONTENT LIBRARY</span><h3>Черновики</h3></div></div>
        <div class="library"><article v-for="item in items" :key="item.id" class="library-row"><div><span class="type">{{ item.type }}</span><h4>{{ item.title }}</h4><p>{{ item.excerpt }}</p></div><div class="row-actions"><span class="status">{{ item.status }}</span><button @click="approve(item)">{{ item.status === 'draft' ? 'На review' : 'Готово' }}</button></div></article></div>
      </section>
      <div v-if="message" class="message">{{ message }}</div>
    </div>
  </MarketingList>
</template>
<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })
const api=useApi()
const contentApi=(path:string, options:any={})=>api(`/api/marketing/content${path}`, options)
const brief=ref('Найди контент-возможности на основе текущего спроса')
const loading=ref(false); const opportunities=ref<any[]>([]); const items=ref<any[]>([]); const message=ref('')
const load=async()=>{const [o,c]=await Promise.all([contentApi<any>('/opportunities'),contentApi<any>('')]);opportunities.value=o.items;items.value=c.items}
const analyze=async()=>{loading.value=true;try{const r=await contentApi<any>('/analyze',{method:'POST',body:{brief:brief.value}});opportunities.value=r.opportunities;message.value=r.summary}catch(e){message.value='Не удалось выполнить анализ'}finally{loading.value=false}}
const generate=async(item:any)=>{const r=await contentApi<any>('/generate',{method:'POST',body:{type:item.type,destination:item.destination,title:item.title,brief:item.reason}});items.value=[r.item,...items.value];message.value=`Создан draft: ${r.item.title}`}
const approve=async(item:any)=>{const next=item.status==='draft'?'review':'approved';const r=await contentApi<any>(`/${item.id}`,{method:'PATCH',body:{status:next}});items.value=items.value.map(x=>x.id===item.id?r.item:x);message.value=`Статус: ${next}`}
onMounted(load)
</script>
<style scoped lang="scss">
.content-page{display:grid;gap:22px}.composer{display:grid;grid-template-columns:1fr 1.15fr auto;gap:18px;align-items:end;background:#17382c;color:#fff;border-radius:18px;padding:24px}.eyebrow{display:block;font:800 10px Inter,sans-serif;letter-spacing:.11em;color:#7c9188}.composer .eyebrow{color:#9fd1b8}.composer h2{font:800 26px/1.1 Manrope;margin:8px 0}.composer p{font:14px/1.6 Inter;color:#c7d4ce;margin:0}.composer textarea{min-height:96px;border:1px solid #476158;background:#23493d;color:#fff;border-radius:10px;padding:12px;resize:vertical;font:14px/1.5 Inter;outline:none}.composer button,.card button,.row-actions button{border:0;background:#fff;color:#17382c;border-radius:9px;padding:12px 14px;font:800 12px Inter;cursor:pointer}.section{display:grid;gap:12px}.section-head h3{font:800 24px Manrope;margin:6px 0 0;color:#14251e}.ideas{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.card,.library{background:#fff;border:1px solid #dfe5e1;border-radius:16px}.card{padding:18px}.top{display:flex;justify-content:space-between;align-items:center}.type{font:800 10px Inter;letter-spacing:.08em;color:#188054;text-transform:uppercase}.priority{font:800 9px Inter;padding:5px 7px;border-radius:999px;background:#edf2ef;color:#5d6d65}.priority.high{background:#e7f5ee;color:#137247}.card h4,.library-row h4{font:800 18px Manrope;margin:14px 0 7px;color:#17382c}.card p,.library-row p{font:13px/1.55 Inter;color:#6d7b74;min-height:65px}.card button{border:1px solid #d5dfd9;background:#fff;margin-top:8px}.library{overflow:hidden}.library-row{display:flex;justify-content:space-between;gap:20px;padding:18px 20px;border-top:1px solid #e8ece9}.library-row:first-child{border-top:0}.library-row h4{margin:6px 0}.library-row p{min-height:0;margin:0}.row-actions{display:flex;align-items:center;gap:10px;white-space:nowrap}.status{font:700 10px Inter;color:#6c7b74;background:#f0f3f1;padding:6px 8px;border-radius:8px}.row-actions button{padding:8px 10px;border:1px solid #d5dfd9}.message{background:#e9f5ef;color:#1a6348;border:1px solid #cde8d9;padding:12px 14px;border-radius:10px;font:700 12px Inter}@media(max-width:900px){.composer{grid-template-columns:1fr}.ideas{grid-template-columns:1fr}.library-row{flex-direction:column}.row-actions{justify-content:space-between}}
</style>
