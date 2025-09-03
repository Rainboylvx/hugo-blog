(function(window) {
    'use strict';

    function getQueryVariable(variable) {
        var query = window.location.search.substring(1);
        var vars = query.split('&');
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split('=');
            if (pair[0] === variable) {
                return decodeURIComponent(pair[1].replace(/\+/g, ' '));
            }
        }
    }

    function main() {
        var searchResultsEl = document.getElementById('search-results');
        var searchQueryEl = document.getElementById('search-input');

        if (!searchResultsEl) {
            return; // Not on the search page
        }

        var index = lunr(function() {
            this.field('title');
            this.field('content');
            this.field('tags');
            this.ref('url');

            for (var key in window.store) {
                this.add({
                    'url': key,
                    'title': window.store[key].title,
                    'tags': window.store[key].tags,
                    'content': window.store[key].content
                });
            }
        });

        var query = getQueryVariable('query');
        if (query) {
            searchQueryEl.value = query;
            var results = index.search(query, { bool: "AND", expand: true });

            if (results.length > 0) {
                results.forEach(function(result) {
                    var item = window.store[result.ref];
                    var li = document.createElement('li');
                    var content_snippet = item.content.substring(0, 150);
                    li.innerHTML = '<a href="' + result.ref + '">' + item.title + '</a><p>' + content_snippet + '...</p>';
                    searchResultsEl.appendChild(li);
                });
            } else {
                searchResultsEl.innerHTML = '<li>No results found.</li>';
            }
        }
    }

    window.addEventListener('DOMContentLoaded', function() {
        var lunr_interval = setInterval(function() {
            if (window.lunr) {
                main();
                clearInterval(lunr_interval);
            }
        }, 50);
    });

})(window);

