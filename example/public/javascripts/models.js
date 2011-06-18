// backbone.js models for node-redis-autocomplete


_.templateSettings = {
  interpolate : /\{\{(.+?)\}\}/g
};

var Tweet = Backbone.Model.extend({});

function tweetToHtml(text) {
  text = text.replace(/(http:\/\/\S+)/g, '<a href="$1">$1</a>');
  text = text.replace(/@(\w+)/, '@<a href="http://twitter.com/$1">$1</a>');
  text = text.replace(/#(\w+)/, '<a href="http://twitter.com/#!/search?q=%23$1">#$1</a>');
  return text;
}


var TweetView = Backbone.View.extend({
  model: Tweet, 

  tagName: "div",

  template: _.template( $('#tweet-template').html() ),

  initialize: function() {
    _.bindAll(this, 'render');
    this.model.bind('change', this.render);
    this.model.view = this;
  },

  render: function() {
    $(this.el).html(this.template(this.model.toJSON()));
    return this;
  }
});

var CompleterApp = Backbone.Model.extend({});

var CompleterAppView = Backbone.View.extend({
  model: CompleterApp,

  el: '#application',

  events: {
    'keyup #search': 'searchKeyup'
  },

  searchKeyup: function(event) {
    // Search for what the user has typed
    var text = $('#search-input').val();

    var self = this;
    this.$('.tweet-content').remove();
    now.search(text, 10, function(err, results) {
      _.each(results, function(line) {
        var match = line.match(/(@\w+)?\s*(.*)/);
        var username = match[0] || '';
        var text = match[1] || '';
        var tweet = new Tweet(
          {username: tweetToHtml(username),
           text: tweetToHtml(text)});
        self.addTweet(tweet);
      });
    });
  },

  addTweet: function(tweet) {
    var view = new TweetView({model: tweet});
    $(this.el).append(view.render().el);
  }
    
});

