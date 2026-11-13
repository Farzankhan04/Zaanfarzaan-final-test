/* CONTACT page (v58) — the "khat" (letter) form, copy-email button and the optional WhatsApp card.
   The form posts to the same Formspree form as the feedback page; the hidden "_subject" and the "reason" field tell the two apart in your inbox.

   WHATSAPP: to show a WhatsApp card on this page, put your number between the quotes — country code first, digits only, no + or spaces
   (for example '919876543210'). Leave it empty and no WhatsApp card is shown. */
(function(){
  var WHATSAPP = '';

  var lang = function(){ var l = window.ZF_LANG; return (l === 'en' || l === 'ur') ? l : 'hi'; };
  var MSG = {
    sending: {hi:'भेज रहा हूँ…', en:'Sending…', ur:'بھیج رہا ہوں…'},
    copied:  {hi:'कॉपी हो गया ✓', en:'Copied ✓', ur:'کاپی ہو گیا ✓'},
    wa:      {hi:'व्हाट्सऐप पर संदेश', en:'Message on WhatsApp', ur:'واٹس ایپ پر پیغام'},
    waText:  {hi:'सलाम ज़ान फ़रज़ान, आपकी वेबसाइट से लिख रहा/रही हूँ।', en:'Salaam Zaan Farzaan, I am writing from your website.', ur:'سلام زان فرزان، آپ کی ویب سائٹ سے لکھ رہا/رہی ہوں۔'}
  };

  var form = document.getElementById('khat-form');
  if(!form) return;
  var eventBox = document.getElementById('khat-event');
  var errorNote = document.getElementById('khat-error');
  var success = document.getElementById('khat-success');
  var sendBtn = document.getElementById('khat-send');
  var again = document.getElementById('khat-again');

  /* event details only when "Mushaira / Event" is chosen */
  Array.prototype.forEach.call(form.querySelectorAll('input[name="reason"]'), function(r){
    r.addEventListener('change', function(){ eventBox.hidden = (form.querySelector('input[name="reason"]:checked').value !== 'Mushaira / Event'); });
  });

  form.addEventListener('submit', function(e){
    e.preventDefault();
    errorNote.hidden = true;
    var label = sendBtn.querySelector('span'), keep = label.innerHTML;
    label.textContent = MSG.sending[lang()];
    sendBtn.classList.add('loading'); sendBtn.disabled = true;
    fetch(form.action, { method:'POST', body:new FormData(form), headers:{ 'Accept':'application/json' } })
      .then(function(res){
        if(!res.ok) throw new Error('failed');
        form.hidden = true; success.hidden = false;
        label.innerHTML = keep; sendBtn.classList.remove('loading'); sendBtn.disabled = false;
        var card = form.closest('.khat'); if(card && card.scrollIntoView) card.scrollIntoView({behavior:'smooth', block:'start'});
      })
      .catch(function(){
        errorNote.hidden = false;
        label.innerHTML = keep; sendBtn.classList.remove('loading'); sendBtn.disabled = false;
      });
  });

  if(again) again.addEventListener('click', function(){
    form.reset(); eventBox.hidden = true; success.hidden = true; form.hidden = false;
  });

  /* copy the email address */
  var copy = document.getElementById('khat-copy');
  if(copy) copy.addEventListener('click', function(){
    var addr = copy.getAttribute('data-email'), orig = copy.innerHTML;
    var done = function(){ copy.textContent = MSG.copied[lang()]; copy.classList.add('done'); setTimeout(function(){ copy.innerHTML = orig; copy.classList.remove('done'); }, 1800); };
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(addr).then(done, done); }
    else { var ta = document.createElement('textarea'); ta.value = addr; document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); }catch(x){} document.body.removeChild(ta); done(); }
  });

  /* optional WhatsApp card */
  var num = String(window.ZF_WHATSAPP || WHATSAPP || '').replace(/\D/g, '');
  var box = document.getElementById('khat-channels');
  if(num && box){
    var l = lang(), a = document.createElement('a');
    a.className = 'khat-ch'; a.target = '_blank'; a.rel = 'noopener';
    a.href = 'https://wa.me/' + num + '?text=' + encodeURIComponent(MSG.waText[l]);
    a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.2 19.8 5.4 16a8 8 0 1 1 2.7 2.6z"/><path d="M9.4 8.8c.2 2.6 2.4 4.9 5 5.2l1-1.2-1.7-.9-.8.6c-.9-.4-1.7-1.2-2.1-2.1l.6-.8-.9-1.7z" fill="currentColor" stroke="none"/></svg>' +
                  '<div class="khat-ch-t"><b>WhatsApp</b><span data-hi="' + MSG.wa.hi + '" data-en="' + MSG.wa.en + '" data-ur="' + MSG.wa.ur + '">' + MSG.wa[l] + '</span></div><i class="khat-go" aria-hidden="true">↗</i>';
    box.insertBefore(a, box.children[1] || null);
  }
})();
