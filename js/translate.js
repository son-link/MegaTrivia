class Translate {

  constructor (lang) {
    if (!lang || typeof lang !== 'string') {
      console.error('Lang no puede estar vacía o no es una cadena');
      return false;
    }
    this.lang = lang
    this.fetchTranslation();
  }

  fetchTranslation() {
    if (typeof fetch == 'undefined') {
      var request = new XMLHttpRequest();

      request.onload = function () {
        if (this.status >= 200 && this.status < 400) {
          this.translation = JSON.parse(this.response);
          this.translateHtml();
        } else console.error(this.status, this.statusText);
      };

      request.onerror = function () {
        console.error(this.status, this.statusText);
      };

      request.send();
    } else {
      fetch(`i18n/${this.lang}.json`)
        .then((res) => res.json())
        .then((translation) => {
          this.translation = translation;
          this.translateHtml();
        })
        .catch(() => {
          console.error(`Could not load ${this.lang}.json.`);
        });
    }
  }

  changeLang(lang, cb = null) {
    if (!lang || typeof lang !== 'string') {
      console.error('Lang no puede estar vacía o no es una cadena');
      return false;
    }
    this.lang = lang
    this.fetchTranslation();

    if (typeof cb == 'function') cb(this.translation);
  }

  /**
   * Translate all tags with data-i18n attribute
   *
   * @memberof Translate
   */
  translateHtml() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach((ele) => {
      const trans = ele.getAttribute('data-i18n');
      if (trans in this.translation) ele.innerHTML = this.translation[trans];
      else ele.innerHTML = trans;
    });
  }

  __(key, replaces = null) {
    if (!key || typeof key !== 'string') {
      return false
    }

    if (key in this.translation) {
      let message = this.translation[key];

      if (replaces && typeof replaces == 'object') {
        return Object.keys(replaces).reduce(
          (text, key) =>
            text.replace(
              new RegExp(`{\s*${key}\s*}`, "g"),
              replaces[key],
            ),
          message,
        );
      } else {
        return this.translation[key];
      }
    }

    return key;
  }
}

export default Translate;