(function ($, undefined) {

    function addRecentlyUpdatedRepo(repo) {
      var $item = $("<li>");

      var $name = $("<a>").attr("href", repo.html_url).text(repo.name);
      $item.append($("<span>").addClass("name").append($name));

      var $time = $("<a>").attr("href", repo.html_url + "/commits").text(strftime("%h %e, %Y", repo.pushed_at));
      $item.append($("<span>").addClass("time").append($time));

      $item.append('<span class="bullet">&sdot;</span>');

      var $watchers = $("<a>").attr("href", repo.html_url + "/watchers").text(repo.watchers + " stargazers");
      $item.append($("<span>").addClass("watchers").append($watchers));

      $item.append('<span class="bullet">&sdot;</span>');

      var $forks = $("<a>").attr("href", repo.html_url + "/network").text(repo.forks + " forks");
      $item.append($("<span>").addClass("forks").append($forks));

      $item.appendTo("#recently-updated-repos");
    }



    function hasTopic(repo, topic){
      return repo.topics && repo.topics.indexOf(topic) !== -1;
    }

    function getCategoryTopics(repo) {
      var categoryTopics = [
        "actinia-core",
        "actinia-plugin",
        "actinia-example",
        "actinia-docs",
        "actinia-deployment",
        "actinia-client"
      ];

      if (!repo.topics) {
        return [];
      }

      return repo.topics.filter(function(topic) {
        return categoryTopics.indexOf(topic) !== -1;
      });
    }

   
    function getRepoTarget(repo,){
      
      if (hasTopic(repo,"actinia-core")){
        return "#core-repos";
      }

      if (hasTopic(repo,"actinia-plugin")){
        return "#plugin-repos";
      }

      if (hasTopic(repo,"actinia-training")){
        return "#example-repos";
      }
      if (hasTopic(repo,"actinia-deployment")){
        return "#deployment-repos";
      }
      if (hasTopic(repo,"actinia-client")){
        return "#client-repos";
      }
      return "#other-repos";
    }  

    function addRepo(repo) {
      var $item = $("<div>").addClass("repo grid-1 " + (repo.language || '').toLowerCase());
      var $link = $("<a>").attr({"href": repo.html_url, "target": "_blank"}).appendTo($item);
      var categoryTopics = getCategoryTopics(repo);

      $link.append($("<h2>").text(repo.name));
      $link.append($("<h3>").text(
        (repo.language || "Unknown") +
        " - ★" + repo.watchers +
        " - ⑂" + repo.forks +
        " - ⊙" + repo.open_issues
      ));

      if (repo.topics && repo.topics.length > 0) {
        $link.append($("<h4>").html("<button>" + repo.topics.join("</button><button>") + "</button>"));
      }

      $link.append($("<p>").text(repo.description || "No description available."));

      if (categoryTopics.length > 1) {
        console.warn(
          "Repository has multiple documentation category topics:",
          repo.name,
          categoryTopics
        );
      }
      $item.appendTo(getRepoTarget(repo));
    }

    function addRepos(repos, page) {
      repos = repos || [];
      page = page || 1;

      var uri = "https://api.github.com/orgs/actinia-org/repos?callback=?"
              + "&per_page=100"
              + "&page="+page;

      $.getJSON(uri, function (result) {
        if (result.data && result.data.length > 0) {
          repos = repos.concat(result.data);
          addRepos(repos, page + 1);
        }
        else {
          $(function () {
            $("#num-repos").text(repos.length);

            // Convert pushed_at to Date.
            $.each(repos, function (i, repo) {
              repo.pushed_at = new Date(repo.pushed_at);

              var weekHalfLife  = 1.146 * Math.pow(10, -9);

              var pushDelta    = (new Date) - Date.parse(repo.pushed_at);
              var createdDelta = (new Date) - Date.parse(repo.created_at);

              var weightForPush = 1;
              var weightForWatchers = 1.314 * Math.pow(10, 7);

              repo.hotness = weightForPush * Math.pow(Math.E, -1 * weekHalfLife * pushDelta);
              repo.hotness += weightForWatchers * repo.watchers / createdDelta;
            });

            // Sort by highest # of watchers.
            repos.sort(function (a, b) {
              if (a.hotness < b.hotness) return 1;
              if (b.hotness < a.hotness) return -1;
              return 0;
            });

            $.each(repos, function (i, repo) {
              if (repo.archived) {
                return true;
              }

              addRepo(repo);
            });

            // Sort by most-recently pushed to.
            repos.sort(function (a, b) {
              if (a.pushed_at < b.pushed_at) return 1;
              if (b.pushed_at < a.pushed_at) return -1;
              return 0;
            });

            $.each(repos.slice(0, 3), function (i, repo) {
              addRecentlyUpdatedRepo(repo);
            });
          });
        }
      });
    }
    addRepos();

    //get total number of members
    function getNumMembers(page, numMembers) {
      var page = page || 1;
      var numMembers = numMembers || 0;
      var membersUri = "https://api.github.com/orgs/actinia-org/members?callback=?"
        + "&per_page=100"
        + "&page="+page;

      $.getJSON(membersUri, function (result) {
        if (result.data && result.data.length > 0) {
          numMembers += result.data.length;
          getNumMembers(page+1, numMembers);
        } else {
          $(function () {
            $("#num-members").text(numMembers);
          });
        }
      });
    }
    getNumMembers();


    function randomItem(array) {
      return array[Math.floor(Math.random() * array.length)];
    }

    var $flyzone;

    function flyzone() {
      if (!$flyzone) {
        $flyzone = $("<div>").attr("id", "flyzone").prependTo(document.body);
      }

      return $flyzone;
    }

    var sizes = ["smaller", "small", "medium", "large", "fat"];

    var sizeDimensions = {
      "smaller": 50,
      "small": 80,
      "medium": 130,
      "large": 200,
      "fat": 300
    };

    function randomOpacity(threshold) {
      var opacity = Math.random();

      while (opacity < threshold) {
        opacity = Math.random();
      }

      return opacity;
    }

    function makeLarry(sizeName, speed) {
      var size = sizeDimensions[sizeName];
      var top = Math.floor((flyzone().height() - size) * Math.random());

      var $img = $("<img>")
        .addClass("larry size-" + sizeName)
        .attr("src", "resources/img/actinia-icon.svg")
        .attr("width", size)
        .attr("height", size)
        .css({
          position: "absolute",
          opacity: randomOpacity(0.4),
          top: top,
          left: -size
        });

      $img.prependTo(flyzone());

      var left = flyzone().width() + size;

      $img.animate({left: left}, speed, function () {
        $img.remove();
        makeRandomLarry();
      });

      return $img;
    }

    function makeRandomLarry() {
      var size = randomItem(sizes);
      var speed = Math.floor(Math.random() * 20000) + 15000;
      return makeLarry(size, speed);
    }

    $(function () {
      $("#logo").click(function () {
        makeRandomLarry();
      });
    });

    var match = (/\blarry(=(\d+))?\b/i).exec(window.location.search);

    if (match) {
      var n = parseInt(match[2]) || 20;

      $(function () {
        for (var i = 0; i < n; ++i) {
          setTimeout(makeRandomLarry, Math.random() * n * 500);
        }
      });
    }

  })(jQuery);
  
$(document).ready(function () {
  var sections = document.querySelectorAll(".repo-section");

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      } else {
        entry.target.classList.remove("is-visible");
      }
    });
  }, {
    threshold: 0.25
  });

  sections.forEach(function (section) {
    observer.observe(section);
  });
});