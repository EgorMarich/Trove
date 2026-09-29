<template>
  <MarketingList title="Marketing AI" eyebrow="AI MARKETING ENGINE">
    <div class="ai">
      <section class="composer">
        <div><span class="eyebrow">CAMPAIGN BUILDER</span><h2>Что хочешь улучшить?</h2><p>Опиши цель обычным языком. Trove соберёт сигналы поведения, предложит аудиторию, каналы, кампанию и идеи контента.</p></div>
        <textarea v-model="brief" placeholder="Например: хочу увеличить бронирования Турции на этой неделе"></textarea>
        <button :disabled="loading" @click="analyze">{{ loading ? 'Анализирую данные…' : 'Проанализировать с AI' }}</button>
      </section>

      <section v-if="analysis" class="results">
        <div class="summary"><span class="eyebrow">{{ analysis.provider === 'llm' ? 'LLM' : 'RULE ENGINE' }}</span><h2>{{ analysis.summary }}</h2></div>
        <div class="grid">
          <article class="card"><span class="eyebrow">OPPORTUNITIES</span><h3>Точки роста</h3><div v-for="item in analysis.opportunities" :key="item.id" class="row"><b>{{ item.title }}</b><p>{{ item.description }}</p></div></article>
          <article class="card"><span class="eyebrow">AUDIENCES</span><h3>Сегменты</h3><div v-for="item in analysis.audiences" :key="item.name" class="row"><b>{{ item.name }}</b><p>{{ item.description }} · ~{{ item.estimatedSize.toLocaleString('ru-RU') }} пользователей</p></div></article>
        </div>
        <div class="grid">
          <article class="card"><span class="eyebrow">CAMPAIGNS</span><h3>Черновики кампаний</h3><div v-for="item in analysis.campaigns" :key="item.name" class="campaign"><div><b>{{ item.name }}</b><small>{{ item.channels.join(' · ') }}</small></div><p>{{ item.content.body }}</p><button @click="createCampaign(item)">Создать черновик</button></div></article>
          <article class="card"><span class="eyebrow">CONTENT</span><h3>Идеи контента</h3><div v-for="item in analysis.contentIdeas" :key="item.title" class="row"><b>{{ item.title }}</b><p>{{ item.angle }}</p></div></article>
        </div>
      </section>

      <div class="guard"><strong>Контроль действий</strong><p>AI анализирует данные и готовит черновики. Платная реклама, бюджеты и внешние отправки остаются approval-gated.</p></div>
    </div>
  </MarketingList>
</template>
<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })
const api = useApi()
const brief = ref('Хочу увеличить бронирования популярных направлений на этой неделе')
const loading = ref(false)
const analysis = ref<any>(null)
const analyze = async () => { loading.value=true; try { analysis.value=await api('/api/marketing/ai/analyze',{method:'POST',body:{brief:brief.value}}) } finally { loading.value=false } }
const createCampaign = async (item:any) => { await api('/api/marketing/campaigns/from-brief',{method:'POST',body:{name:item.name,objective:item.objective,channels:item.channels}}); await navigateTo('/admin/marketing/campaigns') }
</script>
<style scoped lang="scss">
.ai{display:grid;gap:12px}.composer,.summary,.card,.guard{background:#fff;border:1px solid #dfe5e1;border-radius:16px}.composer{padding:24px;display:grid;grid-template-columns:1fr 1.2fr auto;gap:18px;align-items:end}.eyebrow{display:block;font:800 10px Inter,sans-serif;letter-spacing:.11em;color:#668177}.composer h2,.summary h2{font:800 25px/1.15 Manrope,sans-serif;letter-spacing:-.035em;margin:8px 0}.composer p,.guard p{font:14px/1.6 Inter,sans-serif;color:#697770;margin:0}.composer textarea{min-height:92px;resize:vertical;border:1px solid #d9e2dc;border-radius:10px;padding:12px;font:14px/1.5 Inter,sans-serif;outline:none}.composer button,.campaign button{border:0;background:#17382c;color:#fff;border-radius:9px;padding:12px 15px;font:800 12px Inter;cursor:pointer}.composer button:disabled{opacity:.6}.summary{padding:22px;background:#17382c;color:#fff}.summary .eyebrow{color:#9fd1b8}.summary h2{margin-bottom:0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.card{padding:20px}.card h3{font:800 20px Manrope;margin:8px 0 12px}.row{padding:12px 0;border-top:1px solid #e8ece9}.row:first-of-type{border-top:0}.row b{font:800 13px Inter}.row p,.campaign p{font:13px/1.55 Inter;color:#6d7b74;margin:5px 0 0}.campaign{padding:13px 0;border-top:1px solid #e8ece9}.campaign:first-of-type{border-top:0}.campaign div{display:flex;justify-content:space-between;gap:10px}.campaign small{font:600 11px Inter;color:#84918b}.campaign button{margin-top:10px;padding:9px 11px}.guard{padding:18px}.guard strong{font:800 13px Inter}.guard p{margin-top:5px}@media(max-width:900px){.composer{grid-template-columns:1fr}.grid{grid-template-columns:1fr}}
</style>
