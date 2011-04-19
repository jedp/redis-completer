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
    'keydown #search': 'search'
  },

  search: function(event) {
    var self = this;
    this.$('.tweet-content').remove();
    now.search($('#search-input').val(), 10, function(err, results) {
      _.each(results, function(tuple) {
        var tweet = new Tweet(
          {username: tweetToHtml(tuple[0]),
           text: tweetToHtml(tuple[1])});
        self.addTweet(tweet);
      });
    });
  },

  addTweet: function(tweet) {
    var view = new TweetView({model: tweet});
    $(this.el).append(view.render().el);
  }
    
});

