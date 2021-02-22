var tabs =  $(".tabs li a");

tabs.click(function() {
	var content = this.hash.replace('/','');
	tabs.removeClass("active");
	$(this).addClass("active");
	$("#tab_content").find('.tab').hide();
	$(content).fadeIn(200);
});
