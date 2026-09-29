<template>
  <div class="page">
    <NuxtLink to="/account" class="back"><ArrowLeft :size=15 /> Личный кабинет</NuxtLink>
    <div class="head">
      <div><span class="kicker"><Bell :size="14" /> Центр коммуникаций</span><h1>Будем на связи.</h1><p>Выберите, какие сообщения Trove может присылать и куда. Сервисные уведомления всегда остаются отдельно.</p></div>
      <button class="save" :disabled="communications.saving" @click="save">{{ communications.saving ? 'Сохраняем…' : 'Сохранить' }}</button>
    </div>

    <div v-if="communications.preferences" class="layout">
      <main>
        <section class="card">
          <div class="section-head"><div><div class="title-icon coral"><Megaphone :size="17" /></div><h2>Маркетинговые сообщения</h2><p>Акции, персональные предложения, снижение цен и полезные напоминания. Их можно отключить в любой момент.</p></div><span class="badge">По согласию</span></div>
          <Toggle v-model="communications.preferences.emailMarketing" title="Email" description="Промо и персональные предложения на почту" />
          <Toggle v-model="communications.preferences.smsMarketing" title="SMS" description="Короткие предложения и важные маркетинговые напоминания" />
          <Toggle v-model="communications.preferences.pushMarketing" title="Push" description="Уведомления в приложении и браузере" />
        </section>
        <section class="card">
          <div class="section-head"><div><div class="title-icon green"><CheckCircle2 :size="17" /></div><h2>Сервисные сообщения</h2><p>Уведомления о ваших действиях: бронирования, статусы поездок и безопасность аккаунта.</p></div><span class="badge neutral">Отдельно</span></div>
          <Toggle v-model="communications.preferences.emailTransactional" title="Email" description="Подтверждения и статусы бронирований" />
          <Toggle v-model="communications.preferences.smsTransactional" title="SMS" description="Сервисные сообщения по телефону" />
          <Toggle v-model="communications.preferences.pushTransactional" title="Push" description="Сервисные уведомления в приложении и браузере" />
          <div class="security-note">🔐 Сообщения о безопасности аккаунта и восстановлении доступа не зависят от маркетинговых настроек.</div>
        </section>
      </main>
      <aside class="history card">
        <div class="history-head"><div><h2>История</h2><span>{{ communications.unreadCount }} непрочитанных</span></div><button v-if="communications.unreadCount" @click="communications.markAllRead">Прочитать всё</button></div>
        <div v-if="!communications.notifications.length" class="empty">Пока уведомлений нет.</div>
        <article v-for="item in communications.notifications" :key="item.id" :class="['notification', { unread: !item.readAt }]" @click="!item.readAt && communications.markRead(item.id)">
          <div class="notification-top"><span>{{ channelLabel(item.channel) }}</span><time>{{ formatDate(item.createdAt) }}</time></div>
          <strong>{{ item.title }}</strong><p>{{ item.body }}</p>
        </article>
      </aside>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ArrowLeft, Bell, CheckCircle2, Megaphone } from '@lucide/vue'
import Toggle from '~/components/communications/Toggle.vue'
const auth=useAuth(); const communications=useCommunications()
onMounted(async()=>{await auth.load();if(!auth.user.value){await navigateTo({path:'/auth/login',query:{redirect:'/account/communications'}});return}await communications.load()})
const save=async()=>{if(!communications.preferences.value)return;const p=communications.preferences.value;await communications.updatePreferences({emailMarketing:p.emailMarketing,smsMarketing:p.smsMarketing,pushMarketing:p.pushMarketing,emailTransactional:p.emailTransactional,smsTransactional:p.smsTransactional,pushTransactional:p.pushTransactional})}
const channelLabel=(channel:string)=>channel==='email'?'Email':channel==='sms'?'SMS':'Push'
const formatDate=(value:string)=>new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(value))
</script>
<style scoped lang="scss">
.page{width:min(1080px,calc(100% - 48px));margin:auto;padding:42px 0 90px}.back{display:inline-flex;align-items:center;gap:7px;color:var(--muted)!important;text-decoration:none!important;font-size:12px;font-weight:800}.head{display:flex;justify-content:space-between;align-items:end;gap:30px;margin:34px 0}.kicker{display:inline-flex;align-items:center;gap:7px;color:var(--green);font-size:10px;text-transform:uppercase;letter-spacing:.08em;font-weight:900}.head h1{font-family:var(--font-display);font-size:clamp(43px,5vw,60px);line-height:1;letter-spacing:-.06em;margin:11px 0 9px}.head p{max-width:650px;color:var(--muted);font-size:14px;line-height:1.65}.save{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 16px;border:0;border-radius:var(--radius-md);background:var(--ink);color:#fff;font-size:11px;font-weight:900;cursor:pointer}.save:disabled{opacity:.5}.layout{display:grid;grid-template-columns:1fr 380px;gap:16px}.card{background:var(--paper);border:1px solid var(--line);border-radius:var(--radius-lg);padding:23px;box-shadow:var(--shadow-xs)}main .card+ .card{margin-top:16px}.section-head{display:flex;justify-content:space-between;gap:20px;margin-bottom:4px}.section-head h2{margin:9px 0 6px;font-family:var(--font-display);font-size:21px;letter-spacing:-.035em}.section-head p{max-width:580px;margin:0;color:var(--muted);font-size:11px;line-height:1.6}.title-icon{display:grid;place-items:center;width:36px;height:36px;border-radius:10px}.title-icon.coral{background:var(--brand-soft);color:var(--brand)}.title-icon.green{background:var(--green-soft);color:var(--green)}.badge{height:max-content;padding:7px 9px;border-radius:999px;background:var(--brand-soft);color:var(--brand);font-size:9px;font-weight:900;text-transform:uppercase;white-space:nowrap}.badge.neutral{background:var(--surface);color:var(--muted)}.security-note{margin-top:15px;padding:12px;border-radius:10px;background:var(--surface);color:var(--muted);font-size:10px;line-height:1.5}.history{align-self:start}.history-head{display:flex;justify-content:space-between;align-items:start;margin-bottom:5px}.history-head h2{margin:0;font-family:var(--font-display);font-size:21px}.history-head span{display:block;margin-top:3px;font-size:10px;color:var(--muted)}.history-head button{border:0;background:none;color:var(--brand-dark);font-size:10px;font-weight:900;cursor:pointer}.notification{padding:14px 0;border-top:1px solid var(--line);cursor:pointer}.notification.unread{padding-left:10px;border-left:2px solid var(--brand)}.notification-top{display:flex;justify-content:space-between;font-size:9px;color:var(--muted);text-transform:uppercase}.notification strong{display:block;margin-top:6px;font-size:12px}.notification p{margin:5px 0 0;color:var(--muted);font-size:11px;line-height:1.5}.empty{padding:22px 0;color:var(--muted);font-size:11px}@media(max-width:850px){.page{width:calc(100% - 32px)}.head{display:block}.save{margin-top:8px;width:100%}.layout{grid-template-columns:1fr}.history{order:-1}}
</style>