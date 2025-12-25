import Cookies from 'js-cookie'

const TokenKey = 'X-Token'

const LangKey = 'lang'

export function getToken() {
  return Cookies.get(TokenKey)
}

export function setToken(token) {
  return Cookies.set(TokenKey, token)
}

export function removeToken() {
  return Cookies.remove(TokenKey)
}

export function getLang() {
  return Cookies.get(LangKey)
}

export function setLang(lang) {
  return Cookies.set(LangKey, lang)
}
