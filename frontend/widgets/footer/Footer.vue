<template>
  <footer class="footer">
    <div class="footer-main trove-container">
      <div class="footer-brand">
        <NuxtLink to="/" class="logo"><img src="/logo/trove-logo.svg" alt="Trove"  class="imgd"/></NuxtLink>
        <p>Сравниваем предложения разных источников, чтобы вы видели цену, условия и детали поездки в одном месте.</p>
        <div class="trust"><ShieldCheck :size="17" /><span>Цена и наличие ещё раз проверяются перед бронированием.</span></div>
        <div class="socials" aria-label="Социальные сети"><a href="mailto:support@trove.travel" aria-label="Email"><Mail :size="17" /></a><a href="#" aria-label="Telegram"><Send :size="17" /></a><a href="#" aria-label="VK"><MessageCircle :size="17" /></a></div>
      </div>

      <section class="footer-column" :class="{ open: openSections.service }"><button class="footer-column-head" type="button" :aria-expanded="openSections.service" @click="toggle('service')"><b>О сервисе</b><ChevronDown :size="16" /></button><div class="footer-column-body"><NuxtLink to="/">О Trove</NuxtLink><NuxtLink to="/guides">Trove Гид</NuxtLink><NuxtLink to="/support">Поддержка</NuxtLink><NuxtLink to="/legal/terms">Условия использования</NuxtLink></div></section>
      <section class="footer-column" :class="{ open: openSections.travel }"><button class="footer-column-head" type="button" :aria-expanded="openSections.travel" @click="toggle('travel')"><b>Путешественникам</b><ChevronDown :size="16" /></button><div class="footer-column-body"><NuxtLink to="/support">Помощь с бронированием</NuxtLink><NuxtLink to="/guides">Визы и правила</NuxtLink><NuxtLink to="/hot">Горящие предложения</NuxtLink><NuxtLink to="/favorites">Избранное</NuxtLink></div></section>
      <section class="footer-column" :class="{ open: openSections.partners }"><button class="footer-column-head" type="button" :aria-expanded="openSections.partners" @click="toggle('partners')"><b>Партнёрам</b><ChevronDown :size="16" /></button><div class="footer-column-body"><button type="button">Для отелей</button><button type="button">Для туроператоров</button><button type="button">Стать партнёром</button><button type="button">Размещение предложений</button></div></section>

      <div class="newsletter">
        <span class="newsletter-kicker">Trove Письма</span>
        <h3>Идеи для следующей поездки.</h3>
        <p>Редко и по делу: новые направления, хорошие цены и полезные подсказки.</p>
        <form @submit.prevent="subscribe"><div class="email-field"><Mail :size="17" /><input v-model="email" type="email" placeholder="Ваш email" aria-label="Email для рассылки" required /><button type="submit" aria-label="Подписаться"><ArrowRight :size="18" /></button></div></form>
        <small v-if="subscribed" class="success">Готово — проверяйте почту для подтверждения.</small>
        <small v-else>Подписываясь, вы соглашаетесь с политикой конфиденциальности.</small>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="trove-container bottom-inner">
        <span>© {{ new Date().getFullYear() }} Trove</span>
        <div class="legal-links"><NuxtLink to="/legal/privacy">Конфиденциальность</NuxtLink><NuxtLink to="/legal/terms">Оферта и условия</NuxtLink><NuxtLink to="/legal/privacy#cookies">Cookies</NuxtLink></div>
        <div class="locale"><select class="local-select" :value="locale" aria-label="Язык" @change="setLocale(($event.target as HTMLSelectElement).value as any)"><option value="ru">RU</option><option value="en">EN</option><option value="es">ES</option><option value="kk">KZ</option></select><button type="button">₽ RUB <ChevronDown :size="13" /></button></div>
      </div>
    </div>
  </footer>
</template>
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ArrowRight, ChevronDown, Mail, MessageCircle, Send, ShieldCheck } from '@lucide/vue'
const { locale, setLocale, t } = useI18n()
const email=ref(''); const subscribed=ref(false); const openSections=reactive({service:true,travel:true,partners:true})
const toggle=(key:'service'|'travel'|'partners')=>{openSections[key]=!openSections[key]}
const subscribe=()=>{subscribed.value=true}
</script>

<style scoped lang="scss">
.footer{margin-top:0;background:var(--forest);color:#fff;position:relative;z-index:1}.footer-main{display:grid;grid-template-columns:1.45fr .78fr .9fr .9fr 1.35fr;gap:34px;padding:66px 0 58px}.footer-brand{min-width:0}.logo{display:inline-flex;align-items:center;width:122px;height:40px; color:#fff!important;text-decoration:none!important}.logo img{display:block;width:122px;height:auto; background: inherit;}.footer-brand p,.newsletter p{max-width:360px;margin:18px 0 0;color:#b8c9c0;font-size:13px;line-height:1.7}.trust{display:flex;align-items:flex-start;gap:8px;max-width:370px;margin-top:18px;padding-top:16px;border-top:1px solid #355044;color:#d8e3dc;font-size:11px;line-height:1.5}.trust svg{flex:0 0 auto;color:#8bd1ac;margin-top:1px}.socials{display:flex;gap:7px;margin-top:18px}.socials a{display:grid;place-items:center;width:36px;height:36px;border:1px solid #3b5548;border-radius:10px;color:#d9e5df!important;text-decoration:none!important}.socials a:hover{background:#1d4937;border-color:#557262}.footer-column{min-width:0}.footer-column-head{display:flex;align-items:center;justify-content:space-between;width:100%;padding:0 0 10px;border:0;background:transparent;color:#fff;text-align:left;font-size:13px;cursor:pointer}.footer-column-head svg{display:none}.footer-column-body{display:flex;flex-direction:column;gap:11px}.footer-column-body a,.footer-column-body button{padding:0;border:0;background:transparent;color:#b8c9c0!important;text-align:left;text-decoration:none!important;font-size:12px;line-height:1.4;cursor:pointer}.footer-column-body a:hover,.footer-column-body button:hover{color:#fff!important}.newsletter{padding:20px;background:#173e2f;border:1px solid #315447;border-radius:16px}.newsletter-kicker{color:#9bd2b1;font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.newsletter h3{margin:8px 0 5px;font-family:var(--font-display);font-size:22px;line-height:1.05;letter-spacing:-.04em}.newsletter p{margin:0 0 15px;font-size:12px}.email-field{display:flex;align-items:center;gap:7px;height:46px;padding:0 7px 0 11px;background:#fff;border-radius:10px;color:var(--muted)}.email-field input{min-width:0;flex:1;border:0;outline:0;background:transparent;color:var(--ink);font-size:12px}.email-field button{display:grid;place-items:center;width:34px;height:34px;border:0;border-radius:8px;background:var(--brand);color:#fff;cursor:pointer}.newsletter small{display:block;margin-top:9px;color:#8fa69b;font-size:9px;line-height:1.5}.newsletter small.success{color:#a7dfbd}.footer-bottom{border-top:1px solid #30483d}.bottom-inner{display:flex;align-items:center;justify-content:space-between;gap:20px;min-height:72px;color:#80938a;font-size:10px}.legal-links{display:flex;gap:20px}.legal-links a{color:#93a59d!important;text-decoration:none!important}.legal-links a:hover{color:#fff!important}.locale{display:flex;gap:5px}.locale button{display:inline-flex;align-items:center;gap:5px;min-height:30px;padding:0 8px;border:1px solid #385246;border-radius:8px;background:transparent;color:#b9c8c1;font-size:10px;font-weight:800;cursor:pointer}.locale button:hover{background:#173e2f}
@media(max-width:1050px){.footer-main{grid-template-columns:1.5fr 1fr 1fr;gap:30px}.newsletter{grid-column:span 2}}@media(max-width:700px){.footer-main{grid-template-columns:1fr;gap:0;padding:48px 0 24px}.footer-brand{padding-bottom:28px}.footer-column{border-top:1px solid #30483d}.footer-column-head{min-height:55px;padding:0}.footer-column-head svg{display:block;transition:transform .2s var(--ease)}.footer-column.open .footer-column-head svg{transform:rotate(180deg)}.footer-column-body{display:flex;max-height:0;overflow:hidden;gap:11px;transition:max-height .25s var(--ease),padding .25s var(--ease)}.footer-column.open .footer-column-body{max-height:300px;padding-bottom:16px}.newsletter{grid-column:auto;margin-top:22px}.bottom-inner{display:grid;grid-template-columns:1fr;align-items:start;padding:18px 0;gap:12px}.legal-links{flex-wrap:wrap;gap:10px 16px}.locale{order:-1}}@media(min-width:701px){.footer-column-body{display:flex!important}}
</style>
