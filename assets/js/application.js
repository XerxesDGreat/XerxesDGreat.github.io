!function ($) {
  $(function(){
  //   // Activate Bootstrap's tooltips
  //   $("[rel*=tooltip]").tooltip();

    // Add bootstrap table style to table elements
    $("article.content table").addClass('table').addClass('table-hover');

    // create tree
    $('.tree li:has(ul)').addClass('parent_li').find(' > span').attr('title', 'Collapse this branch');
    $('.tree li.parent_li > span').on('click', function (e) {
        // var children = $(this).siblings('ul:first').find('> li');
        var children = $(this).next('ul').find('> li');
        if (children.is(":visible")) {
            children.hide('fast');
            $(this).attr('title', 'Expand this branch').find(' > i').removeClass('fa fa-minus-square-o').addClass('fa fa-plus-square-o');
        } else {
            children.show('fast');
            $(this).attr('title', 'Collapse this branch').find(' > i').removeClass('fa fa-plus-square-o').addClass('fa fa-minus-square-o');
        }
        e.stopPropagation();
    });

    // Activate zoom on content images in the main column and add an icon overlay (but ignore icons)
    $("article.content img").each(function(){
      // Until we properly generate thumbnails and their links on Pelican's side, we just link an image to itself.
      if ($(this).width() > $('article.content').width()) {
        if ($(this).parents('a').length === 0) {
          $(this).wrap(
            $('<a/>').attr('href', $(this).attr('src'))
          );
        }

        // Add a special class for images linking to videos
        var link_tag = $(this).closest('a');
        link_tag.magnificPopup({
          type: 'image',
          closeOnContentClick: true,
          midClick: true,
          mainClass: 'mfp-with-zoom',
          zoom: {
            enabled: true,
            duration: 300,
            easing: 'ease-in-out',
          },
        });
        $(this).css('max-width', $('article.content').width());
        
        // // Add overlay zoom icon
        // $(this).mglass({opacity: 1,});
      };
    });

  });
}(window.jQuery);
