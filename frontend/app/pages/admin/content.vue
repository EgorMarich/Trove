<template>
  <div class="admin-page content-admin">
    <div class="page-header"><div><span class="eyebrow">CONTENT</span><h1>Главная страница</h1><p>Управляйте акциями и блоками без изменения кода.</p></div><button class="btn primary" @click="newBlock">+ Добавить блок</button></div>

    <section class="admin-card"><div class="card-head"><div><h2>Акции</h2><p>Карточки, которые появляются на главной автоматически.</p></div><button class="btn" @click="newPromotion">+ Акция</button></div>
      <div v-if="promotions.length" class="content-list">
        <div v-for="p in promotions" :key="p.id" class="content-row"><div><b>{{ p.translations?.ru?.title || p.slug }}</b><span>{{ p.status }} · priority {{ p.priority }}</span></div><div class="row-actions"><button class="btn" @click="editPromotion(p)">Редактировать</button><button class="btn danger" @click="removePromotion(p.id)">Удалить</button></div></div>
      </div><div v-else class="empty-state">Пока нет акций.</div>
    </section>

    <section class="admin-card"><div class="card-head"><div><h2>Блоки</h2><p>Порядок определяется полем sort order. Блок можно привязать к языку.</p></div></div>
      <div v-if="blocks.length" class="content-list"><div v-for="b in blocks" :key="b.id" class="content-row"><div><b>{{ b.title || b.block_type }}</b><span>{{ b.block_type }} · {{ b.status }} · {{ b.locale }} · #{{ b.sort_order }}</span></div><div class="row-actions"><button class="btn" @click="editBlock(b)">Редактировать</button><button class="btn danger" @click="removeBlock(b.id)">Удалить</button></div></div></div><div v-else class="empty-state">Пока нет управляемых блоков.</div>
    </section>

    <div v-if="promotionForm" class="editor-panel"><div class="panel-head"><h2>{{ promotionForm.id ? 'Редактировать акцию' : 'Новая акция' }}</h2><button class="btn" @click="promotionForm=null">Закрыть</button></div>
      <div class="form-grid"><label>Slug<input v-model="promotionForm.slug" /></label><label>Статус<select v-model="promotionForm.status"><option value="draft">draft</option><option value="published">published</option><option value="archived">archived</option></select></label><label>Изображение<input v-model="promotionForm.imageUrl" /></label><label>Badge<input v-model="promotionForm.badge" /></label><label>Priority<input v-model.number="promotionForm.priority" type="number" /></label><label>Начало<input v-model="promotionForm.startsAt" type="datetime-local" /></label><label>Окончание<input v-model="promotionForm.endsAt" type="datetime-local" /></label></div>
      <div class="locale-fields"><h3>RU</h3><input v-model="promotionForm.translations.ru.title" placeholder="Заголовок"/><textarea v-model="promotionForm.translations.ru.subtitle" placeholder="Подзаголовок"/><input v-model="promotionForm.translations.ru.ctaUrl" placeholder="/tours"/></div>
      <div class="locale-fields"><h3>EN</h3><input v-model="promotionForm.translations.en.title" placeholder="Title"/><textarea v-model="promotionForm.translations.en.subtitle" placeholder="Subtitle"/><input v-model="promotionForm.translations.en.ctaUrl" placeholder="/tours"/></div>
      <div class="locale-fields"><h3>ES</h3><input v-model="promotionForm.translations.es.title" placeholder="Título"/><textarea v-model="promotionForm.translations.es.subtitle" placeholder="Subtítulo"/><input v-model="promotionForm.translations.es.ctaUrl" placeholder="/tours"/></div>
      <div class="locale-fields"><h3>KK</h3><input v-model="promotionForm.translations.kk.title" placeholder="Тақырып"/><textarea v-model="promotionForm.translations.kk.subtitle" placeholder="Сипаттама"/><input v-model="promotionForm.translations.kk.ctaUrl" placeholder="/tours"/></div>
      <button class="btn primary" :disabled="saving" @click="savePromotion">Сохранить акцию</button>
    </div>

    <div v-if="blockForm" class="editor-panel"><div class="panel-head"><h2>{{ blockForm.id ? 'Редактировать блок' : 'Новый блок' }}</h2><button class="btn" @click="blockForm=null">Закрыть</button></div>
      <div class="form-grid"><label>Тип<select v-model="blockForm.blockType"><option value="hero">Hero</option><option value="text">Text</option><option value="image">Image</option><option value="promotion">Promotion</option><option value="tours">Tours</option><option value="guides">Guides</option><option value="destinations">Destinations</option></select></label><label>Статус<select v-model="blockForm.status"><option value="draft">draft</option><option value="published">published</option><option value="archived">archived</option></select></label><label>Язык<select v-model="blockForm.locale"><option value="all">all</option><option value="ru">RU</option><option value="en">EN</option><option value="es">ES</option><option value="kk">KK</option></select></label><label>Sort order<input v-model.number="blockForm.sortOrder" type="number" /></label><label>Заголовок<input v-model="blockForm.title" /></label><label>Подзаголовок<input v-model="blockForm.subtitle" /></label></div>
      <div class="json-editor"><label>Данные блока (JSON)<textarea v-model="blockJson" rows="12"></textarea></label><p>Для image: <code>{"imageUrl":"...","url":"/tours","eyebrow":"..."}</code>. Для text/hero: <code>{"eyebrow":"...","ctaLabel":"...","ctaUrl":"/tours"}</code>.</p></div>
      <button class="btn primary" :disabled="saving" @click="saveBlock">Сохранить блок</button>
    </div>
  </div>
</template>
<script setup lang="ts">
definePageMeta({ layout:'admin', middleware:'admin' })
const api=useApi(); const promotions=ref<any[]>([]); const blocks=ref<any[]>([]); const saving=ref(false); const promotionForm=ref<any>(null); const blockForm=ref<any>(null); const blockJson=ref('{}')
const emptyTranslations=()=>({ru:{title:'',subtitle:'',cta:'Подробнее',ctaUrl:'/tours'},en:{title:'',subtitle:'',cta:'Learn more',ctaUrl:'/tours'},es:{title:'',subtitle:'',cta:'Más información',ctaUrl:'/tours'},kk:{title:'',subtitle:'Толығырақ',ctaUrl:'/tours'}})
const load=async()=>{const [p,b]=await Promise.all([api<any>('/admin/promotions'),api<any>('/admin/homepage-blocks')]);promotions.value=p.items||[];blocks.value=b.items||[]}
const newPromotion=()=>promotionForm.value={slug:'',status:'draft',imageUrl:'',badge:'',priority:0,startsAt:'',endsAt:'',translations:emptyTranslations()}
const editPromotion=(p:any)=>promotionForm.value=JSON.parse(JSON.stringify(p))
const savePromotion=async()=>{saving.value=true;try{await api('/admin/promotions',{method:'POST',body:promotionForm.value});promotionForm.value=null;await load()}finally{saving.value=false}}
const removePromotion=async(id:string)=>{if(!confirm('Удалить акцию?'))return;await api(`/admin/promotions/${id}`,{method:'DELETE'});await load()}
const newBlock=()=>{blockForm.value={blockType:'text',status:'draft',locale:'all',sortOrder:0,title:'',subtitle:'',data:{}};blockJson.value='{}'}
const editBlock=(b:any)=>{blockForm.value={id:b.id,blockType:b.block_type,status:b.status,locale:b.locale,sortOrder:b.sort_order,title:b.title||'',subtitle:b.subtitle||'',data:b.data||{}};blockJson.value=JSON.stringify(b.data||{},null,2)}
const saveBlock=async()=>{if(!blockForm.value)return;let data:any;try{data=JSON.parse(blockJson.value||'{}')}catch{alert('Некорректный JSON');return}saving.value=true;try{await api('/admin/homepage-blocks',{method:'POST',body:{...blockForm.value,data}});blockForm.value=null;await load()}finally{saving.value=false}}
const removeBlock=async(id:string)=>{if(!confirm('Удалить блок?'))return;await api(`/admin/homepage-blocks/${id}`,{method:'DELETE'});await load()}
await load()
</script>
<style scoped lang="scss">
.content-admin{max-width:1280px}.page-header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:22px}.page-header h1{margin:4px 0}.page-header p,.card-head p{color:var(--muted);font-size:13px}.admin-card,.editor-panel{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:20px;margin-bottom:18px}.card-head,.panel-head{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:16px}.card-head h2,.panel-head h2{margin:0}.content-list{display:flex;flex-direction:column}.content-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:15px 0;border-top:1px solid var(--line)}.content-row>div:first-child{display:flex;flex-direction:column;gap:5px}.content-row span{color:var(--muted);font-size:11px}.row-actions{display:flex;gap:8px}.btn.danger{color:#b44545}.form-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:13px;margin-bottom:16px}.form-grid label,.locale-fields,.json-editor label{display:flex;flex-direction:column;gap:7px;font-size:11px;font-weight:800;color:var(--muted)}input,select,textarea{font:inherit;font-weight:500;color:var(--ink);background:#fff;border:1px solid var(--line-strong);border-radius:9px;padding:10px 11px;outline:none}textarea{min-height:86px;resize:vertical}.locale-fields{margin:14px 0;padding:14px;background:#f5f7f5;border-radius:12px}.locale-fields h3{margin:0;color:var(--ink)}.json-editor{margin:14px 0}.json-editor code{font-size:10px}.empty-state{padding:30px;text-align:center;color:var(--muted)}@media(max-width:700px){.page-header{display:block}.page-header .btn{margin-top:12px}.form-grid{grid-template-columns:1fr}.content-row{align-items:flex-start;flex-direction:column}.row-actions{width:100%}.row-actions .btn{flex:1}}
</style>
