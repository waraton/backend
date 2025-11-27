/* for button forming */
const open = document.querySelector('[open]');
const close = document.querySelector('[close]');
if (open) {
  const form = document.getElementById(open.dataset.for)
  open.addEventListener('click',()=>{
    form.classList.add('active')
  })
}
if (close) {
  const form = document.getElementById(close.dataset.for)
  close.addEventListener('click',()=>{
    form.classList.remove('active')
  })
  form.addEventListener('click',(e)=>{
    e.target === form ? form.classList.remove('active') : false;
  })

}
