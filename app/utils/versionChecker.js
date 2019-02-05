class VersionChecker {
  latest () {
    return fetch(
      'https://api.github.com/repos/absalomedia/minser/releases/latest',
      {
        method: 'GET',
        headers: {'User-Agent': 'absalomedia/minser'},
        mode: 'cors',
        cache: 'default'
      })
      .then(response => response.text())
      .then(body => JSON.parse(body).tag_name)
  }
}

module.exports = VersionChecker
