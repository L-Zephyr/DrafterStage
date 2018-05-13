import Vue from 'vue'
import App from './App.vue'
import store from './store/index'

new Vue({
    el: '#app',
    store, // 将store注入到所有的子组件中
    template: '<App/>',
    components: { App }
})