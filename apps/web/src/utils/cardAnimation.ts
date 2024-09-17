function flower_animation() {
  animate_card(360);
  setTimeout(() => {
    open_all_cards();
    setTimeout(() => {
      close_all_cards();
      setTimeout(() => {
        reset_cards();
      }, 1000);
    }, 1000);
  }, 1000);
}
