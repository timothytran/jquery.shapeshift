(function() {
  (function($, window, document) {
    var Plugin, defaults, pluginName;
    pluginName = "shapeshift";
    defaults = {
      selector: "*",
      enableDrag: true,
      enableCrossDrop: true,
      enableResize: true,
      enableTrash: false,
      align: "center",
      colWidth: null,
      columns: null,
      minColumns: 1,
      autoHeight: true,
      maxHeight: null,
      minHeight: 100,
      gutterX: 10,
      gutterY: 10,
      paddingX: 10,
      paddingY: 10,
      animated: true,
      animateOnInit: false,
      animationSpeed: 225,
      animationThreshold: 100,
      dragClone: false,
      deleteClone: true,
      dragRate: 100,
      dragWhitelist: "*",
      crossDropWhitelist: "*",
      cutoffStart: null,
      cutoffEnd: null,
      handle: false,
      cloneClass: "ss-cloned-child",
      activeClass: "ss-active-child",
      draggedClass: "ss-dragged-child",
      placeholderClass: "ss-placeholder-child",
      originalContainerClass: "ss-original-container",
      currentContainerClass: "ss-current-container",
      previousContainerClass: "ss-previous-container"
    };
    Plugin = (function() {
      function Plugin(element, options) {
        this.element = element;
        this.options = $.extend({}, defaults, options);
        this.globals = {};
        this.$container = $(element);
        if (this.errorCheck()) {
          this.init();
        }
      }

      Plugin.prototype.errorCheck = function() {
        var $children, error_msg, errors, options;
        options = this.options;
        errors = false;
        error_msg = "Shapeshift ERROR:";
        if (options.colWidth === null) {
          $children = this.$container.children(options.selector);
          if ($children.length === 0) {
            errors = true;
            console.error("" + error_msg + " option colWidth must be specified if Shapeshift is initialized with no active children.");
          }
        }
        return !errors;
      };

      Plugin.prototype.init = function() {
        this.createEvents();
        this.setGlobals();
        this.setIdentifier();
        this.setActiveChildren();
        this.enableFeatures();
        this.gridInit();
        this.render();
        return this.afterInit();
      };

      Plugin.prototype.createEvents = function() {
        var $container, options;
        options = this.options;
        $container = this.$container;
        $container.off("ss-arrange").on("ss-arrange", (function(_this) {
          return function(e, trigger_drop_finished) {
            if (trigger_drop_finished == null) {
              trigger_drop_finished = false;
            }
            return _this.render(false, trigger_drop_finished);
          };
        })(this));
        $container.off("ss-rearrange").on("ss-rearrange", (function(_this) {
          return function() {
            return _this.render(true);
          };
        })(this));
        $container.off("ss-setTargetPosition").on("ss-setTargetPosition", (function(_this) {
          return function() {
            return _this.setTargetPosition();
          };
        })(this));
        return $container.off("ss-destroy").on("ss-destroy", (function(_this) {
          return function() {
            return _this.destroy();
          };
        })(this));
      };

      Plugin.prototype.setGlobals = function() {
        return this.globals.animated = this.options.animateOnInit;
      };

      Plugin.prototype.afterInit = function() {
        return this.globals.animated = this.options.animated;
      };

      Plugin.prototype.setIdentifier = function() {
        this.identifier = "shapeshifted_container_" + Math.random().toString(36).substring(7);
        return this.$container.addClass(this.identifier);
      };

      Plugin.prototype.enableFeatures = function() {
        if (this.options.enableResize) {
          this.enableResize();
        }
        if (this.options.enableDrag || this.options.enableCrossDrop) {
          return this.enableDragNDrop();
        }
      };

      Plugin.prototype.setActiveChildren = function() {
        var $children, active_child_class, colspan, columns, i, min_columns, options, total, _i, _j, _ref, _results;
        options = this.options;
        $children = this.$container.children(options.selector);
        active_child_class = options.activeClass;
        total = $children.length;
        for (i = _i = 0; 0 <= total ? _i < total : _i > total; i = 0 <= total ? ++_i : --_i) {
          $($children[i]).addClass(active_child_class);
        }
        this.setParsedChildren();
        columns = options.columns;
        _results = [];
        for (i = _j = 0, _ref = this.parsedChildren.length; 0 <= _ref ? _j < _ref : _j > _ref; i = 0 <= _ref ? ++_j : --_j) {
          colspan = this.parsedChildren[i].colspan;
          min_columns = options.minColumns;
          if (colspan > columns && colspan > min_columns) {
            _results.push(options.minColumns = colspan);
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };

      Plugin.prototype.setParsedChildren = function() {
        var $child, $children, child, i, parsedChildren, total, _i;
        $children = this.$container.find("." + this.options.activeClass).filter(":visible");
        total = $children.length;
        parsedChildren = [];
        for (i = _i = 0; 0 <= total ? _i < total : _i > total; i = 0 <= total ? ++_i : --_i) {
          $child = $($children[i]);
          child = {
            i: i,
            el: $child,
            colspan: parseInt($child.attr("data-ss-colspan")) || 1,
            height: $child.outerHeight()
          };
          parsedChildren.push(child);
        }
        return this.parsedChildren = parsedChildren;
      };

      Plugin.prototype.gridInit = function() {
        var fc_colspan, fc_width, first_child, gutter_x, single_width;
        gutter_x = this.options.gutterX;
        if (!(this.options.colWidth >= 1)) {
          first_child = this.parsedChildren[0];
          if (first_child && first_child.el) {
            fc_width = first_child.el.outerWidth();
            fc_colspan = first_child.colspan;
          } else {
            fc_width = 0;
            fc_colspan = 1;
          }
          single_width = (fc_width - ((fc_colspan - 1) * gutter_x)) / fc_colspan;
          return this.globals.col_width = single_width + gutter_x;
        } else {
          return this.globals.col_width = this.options.colWidth + gutter_x;
        }
      };

      Plugin.prototype.render = function(reparse, trigger_drop_finished) {
        if (reparse == null) {
          reparse = false;
        }
        this.setGridColumns();
        return this.arrange(reparse, trigger_drop_finished);
      };

      Plugin.prototype.setGridColumns = function() {
        var children_count, col_width, colspan, columns, globals, grid_width, gutter_x, i, inner_width, minColumns, offset_col, options, padding_x, _i;
        globals = this.globals;
        options = this.options;
        col_width = globals.col_width;
        gutter_x = options.gutterX;
        padding_x = options.paddingX;
        inner_width = this.$container.innerWidth() - (padding_x * 2);
        offset_col = 0;
        minColumns = options.minColumns;
        columns = options.columns || Math.floor((inner_width + gutter_x) / col_width);
        if (minColumns && minColumns > columns) {
          columns = minColumns;
        }
        globals.columns = columns;
        children_count = this.parsedChildren.length;
        if (columns > children_count) {
          for (i = _i = 0; 0 <= children_count ? _i < children_count : _i > children_count; i = 0 <= children_count ? ++_i : --_i) {
            colspan = this.parsedChildren[i].colspan;
            if (colspan > 1) {
              offset_col = colspan - 1;
            }
          }
          columns = children_count;
        }
        globals.child_offset = padding_x;
        switch (options.align) {
          case "center":
            grid_width = ((columns + offset_col) * col_width) - gutter_x;
            globals.child_offset += (inner_width - grid_width) / 2;
            break;
          case "right":
            grid_width = (columns * col_width) - gutter_x;
            globals.child_offset += inner_width - grid_width;
        }
        return globals.grid_width = grid_width;
      };

      Plugin.prototype.arrange = function(reparse, trigger_drop_finished) {
        var $child, $container, animated, animation_speed, attributes, child_positions, container_height, dragged_class, globals, i, is_dragged_child, max_height, min_height, options, parsed_children, placeholder_class, total_children, _i;
        if (reparse) {
          this.setParsedChildren();
        }
        globals = this.globals;
        options = this.options;
        $container = this.$container;
        child_positions = this.getPositions();
        parsed_children = this.parsedChildren;
        total_children = parsed_children.length;
        animated = globals.animated && total_children <= options.animationThreshold;
        animation_speed = options.animationSpeed;
        dragged_class = options.draggedClass;
        for (i = _i = 0; 0 <= total_children ? _i < total_children : _i > total_children; i = 0 <= total_children ? ++_i : --_i) {
          $child = parsed_children[i].el;
          attributes = child_positions[i];
          is_dragged_child = $child.hasClass(dragged_class);
          if (is_dragged_child) {
            placeholder_class = options.placeholderClass;
            $child = $child.siblings("." + placeholder_class);
          }
          if (animated && !is_dragged_child) {
            $child.stop(true, false).animate(attributes, animation_speed, function() {});
          } else {
            $child.css(attributes);
          }
        }
        if (trigger_drop_finished) {
          if (animated) {
            setTimeout((function() {
              return $container.trigger("ss-drop-complete");
            }), animation_speed);
          } else {
            $container.trigger("ss-drop-complete");
          }
        }
        $container.trigger("ss-arranged");
        if (options.autoHeight) {
          container_height = globals.container_height;
          max_height = options.maxHeight;
          min_height = options.minHeight;
          if (min_height && container_height < min_height) {
            container_height = min_height;
          } else if (max_height && container_height > max_height) {
            container_height = max_height;
          }
          return $container.height(container_height);
        }
      };

      Plugin.prototype.getPositions = function(include_dragged) {
        var col_heights, determineMultiposition, determinePositions, dragged_class, globals, grid_height, gutter_y, i, options, padding_y, parsed_children, positions, recalculateSavedChildren, savePosition, saved_children, total_children, _i, _ref;
        if (include_dragged == null) {
          include_dragged = true;
        }
        globals = this.globals;
        options = this.options;
        gutter_y = options.gutterY;
        padding_y = options.paddingY;
        dragged_class = options.draggedClass;
        parsed_children = this.parsedChildren;
        total_children = parsed_children.length;
        col_heights = [];
        for (i = _i = 0, _ref = globals.columns; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          col_heights.push(padding_y);
        }
        savePosition = (function(_this) {
          return function(child) {
            var col, colspan, j, offset_x, offset_y, _j, _results;
            col = child.col;
            colspan = child.colspan;
            offset_x = (child.col * globals.col_width) + globals.child_offset;
            offset_y = col_heights[col];
            positions[child.i] = {
              left: offset_x,
              top: offset_y
            };
            col_heights[col] += child.height + gutter_y;
            if (colspan >= 1) {
              _results = [];
              for (j = _j = 1; 1 <= colspan ? _j < colspan : _j > colspan; j = 1 <= colspan ? ++_j : --_j) {
                _results.push(col_heights[col + j] = col_heights[col]);
              }
              return _results;
            }
          };
        })(this);
        determineMultiposition = (function(_this) {
          return function(child) {
            var chosen_col, col, colspan, height, kosher, next_height, offset, possible_col_heights, possible_cols, span, _j, _k;
            possible_cols = col_heights.length - child.colspan + 1;
            possible_col_heights = col_heights.slice(0).splice(0, possible_cols);
            chosen_col = void 0;
            for (offset = _j = 0; 0 <= possible_cols ? _j < possible_cols : _j > possible_cols; offset = 0 <= possible_cols ? ++_j : --_j) {
              col = _this.lowestCol(possible_col_heights, offset);
              colspan = child.colspan;
              height = col_heights[col];
              kosher = true;
              for (span = _k = 1; 1 <= colspan ? _k < colspan : _k > colspan; span = 1 <= colspan ? ++_k : --_k) {
                next_height = col_heights[col + span];
                if (height < next_height) {
                  kosher = false;
                  break;
                }
              }
              if (kosher) {
                chosen_col = col;
                break;
              }
            }
            return chosen_col;
          };
        })(this);
        saved_children = [];
        recalculateSavedChildren = (function(_this) {
          return function() {
            var index, pop_i, saved_child, saved_i, to_pop, _j, _k, _ref1, _ref2, _results;
            to_pop = [];
            for (saved_i = _j = 0, _ref1 = saved_children.length; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; saved_i = 0 <= _ref1 ? ++_j : --_j) {
              saved_child = saved_children[saved_i];
              saved_child.col = determineMultiposition(saved_child);
              if (saved_child.col >= 0) {
                savePosition(saved_child);
                to_pop.push(saved_i);
              }
            }
            _results = [];
            for (pop_i = _k = _ref2 = to_pop.length - 1; _k >= 0; pop_i = _k += -1) {
              index = to_pop[pop_i];
              _results.push(saved_children.splice(index, 1));
            }
            return _results;
          };
        })(this);
        positions = [];
        (determinePositions = (function(_this) {
          return function() {
            var child, _j, _results;
            _results = [];
            for (i = _j = 0; 0 <= total_children ? _j < total_children : _j > total_children; i = 0 <= total_children ? ++_j : --_j) {
              child = parsed_children[i];
              if (!(!include_dragged && child.el.hasClass(dragged_class))) {
                if (child.colspan > 1) {
                  child.col = determineMultiposition(child);
                } else {
                  child.col = _this.lowestCol(col_heights);
                }
                if (child.col === void 0) {
                  saved_children.push(child);
                } else {
                  savePosition(child);
                }
                _results.push(recalculateSavedChildren());
              } else {
                _results.push(void 0);
              }
            }
            return _results;
          };
        })(this))();
        if (options.autoHeight) {
          grid_height = col_heights[this.highestCol(col_heights)] - gutter_y;
          globals.container_height = grid_height + padding_y;
        }
        return positions;
      };

      Plugin.prototype.enableDragNDrop = function() {
        var $clone, $container, $placeholder, $selected, active_class, clone_class, current_container_class, delete_clone, drag_clone, drag_rate, dragged_class, dragging, options, original_container_class, placeholder_class, previous_container_class, selected_offset_x, selected_offset_y;
        options = this.options;
        $container = this.$container;
        active_class = options.activeClass;
        dragged_class = options.draggedClass;
        placeholder_class = options.placeholderClass;
        original_container_class = options.originalContainerClass;
        current_container_class = options.currentContainerClass;
        previous_container_class = options.previousContainerClass;
        delete_clone = options.deleteClone;
        drag_rate = options.dragRate;
        drag_clone = options.dragClone;
        clone_class = options.cloneClass;
        $selected = $placeholder = $clone = selected_offset_y = selected_offset_x = null;
        dragging = false;
        if (options.enableDrag) {
          $container.children("." + active_class).filter(options.dragWhitelist).draggable({
            addClasses: false,
            containment: 'document',
            handle: options.handle,
            zIndex: 9999,
            start: function(e, ui) {
              var selected_tag;
              $selected = $(e.target);
              if (drag_clone) {
                $clone = $selected.clone(true).insertBefore($selected).addClass(clone_class);
              }
              $selected.addClass(dragged_class);
              selected_tag = $selected.prop("tagName");
              $placeholder = $("<" + selected_tag + " class='" + placeholder_class + "' style='height: " + ($selected.height()) + "px; width: " + ($selected.width()) + "'></" + selected_tag + ">");
              $selected.parent().addClass(original_container_class).addClass(current_container_class);
              selected_offset_y = $selected.outerHeight() / 2;
              return selected_offset_x = $selected.outerWidth() / 2;
            },
            drag: (function(_this) {
              return function(e, ui) {
                if (!dragging && !(drag_clone && delete_clone && $("." + current_container_class)[0] === $("." + original_container_class)[0])) {
                  $placeholder.remove().appendTo("." + current_container_class);
                  $("." + current_container_class).trigger("ss-setTargetPosition");
                  dragging = true;
                  window.setTimeout((function() {
                    return dragging = false;
                  }), drag_rate);
                }
                ui.position.left = e.pageX - $selected.parent().offset().left - selected_offset_x;
                return ui.position.top = e.pageY - $selected.parent().offset().top - selected_offset_y;
              };
            })(this),
            stop: function() {
              var $current_container, $original_container, $previous_container;
              $original_container = $("." + original_container_class);
              $current_container = $("." + current_container_class);
              $previous_container = $("." + previous_container_class);
              $selected.removeClass(dragged_class);
              $("." + placeholder_class).remove();
              if (drag_clone) {
                if (delete_clone && $("." + current_container_class)[0] === $("." + original_container_class)[0]) {
                  $clone.remove();
                  $("." + current_container_class).trigger("ss-rearrange");
                } else {
                  $clone.removeClass(clone_class);
                }
              }
              if ($original_container[0] === $current_container[0]) {
                $current_container.trigger("ss-rearranged", $selected);
              } else {
                $original_container.trigger("ss-removed", $selected);
                $current_container.trigger("ss-added", $selected);
              }
              $original_container.trigger("ss-arrange").removeClass(original_container_class);
              $current_container.trigger("ss-arrange", true).removeClass(current_container_class);
              $previous_container.trigger("ss-arrange").removeClass(previous_container_class);
              return $selected = $placeholder = null;
            }
          });
        }
        if (options.enableCrossDrop) {
          return $container.droppable({
            accept: options.crossDropWhitelist,
            tolerance: 'intersect',
            over: (function(_this) {
              return function(e) {
                $("." + previous_container_class).removeClass(previous_container_class);
                $("." + current_container_class).removeClass(current_container_class).addClass(previous_container_class);
                return $(e.target).addClass(current_container_class);
              };
            })(this),
            drop: (function(_this) {
              return function(e, selected) {
                var $current_container, $original_container, $previous_container;
                if (_this.options.enableTrash) {
                  $original_container = $("." + original_container_class);
                  $current_container = $("." + current_container_class);
                  $previous_container = $("." + previous_container_class);
                  $selected = $(selected.helper);
                  $current_container.trigger("ss-trashed", $selected);
                  $selected.remove();
                  $original_container.trigger("ss-rearrange").removeClass(original_container_class);
                  $current_container.trigger("ss-rearrange").removeClass(current_container_class);
                  return $previous_container.trigger("ss-arrange").removeClass(previous_container_class);
                }
              };
            })(this)
          });
        }
      };

      Plugin.prototype.setTargetPosition = function() {
        var $container, $placeholder, $selected, $start_container, $target, attributes, attributes_bottom, attributes_right, child_positions, current, cutoff_end, cutoff_start, dragged_class, full_height, full_width, globals, half_height, half_width, lastChild, lastPosition, offset_x, offset_y, options, parsed_children, placeholder_class, placeholder_x, placeholder_y, placeolder_class, position_i, previous_container_class, selected_height, selected_width, selected_x1, selected_x2, selected_y1, selected_y2, target_direction, target_position, total_positions, _i;
        options = this.options;
        globals = this.globals;
        $container = this.$container;
        if (!options.enableTrash) {
          dragged_class = options.draggedClass;
          placeolder_class = options.placeholderClass;
          $selected = $("." + dragged_class);
          $placeholder = $("." + placeolder_class);
          $start_container = $selected.parent();
          parsed_children = this.parsedChildren;
          child_positions = this.getPositions(true);
          total_positions = child_positions.length;
          selected_width = $selected.width();
          selected_height = $selected.height();
          selected_x1 = $selected.offset().left - $start_container.offset().left;
          selected_x2 = $selected.offset().left - $start_container.offset().left + $selected.width();
          selected_y1 = $selected.offset().top - $start_container.offset().top;
          selected_y2 = $selected.offset().top - $start_container.offset().top + selected_height;
          placeholder_x = +$placeholder.css('left').replace('px', '');
          placeholder_y = +$placeholder.css('top').replace('px', '');
          if (selected_x1 > placeholder_x) {
            target_direction = 'right';
          } else {
            target_direction = 'left';
          }
          target_position = null;
          if (total_positions > 1) {
            cutoff_start = options.cutoffStart || 0;
            cutoff_end = options.cutoffEnd || total_positions;
            lastPosition = child_positions[total_positions - 1];
            lastChild = parsed_children[total_positions - 1];
            if (selected_y2 > lastPosition.top + lastChild.el.height()) {
              target_position = total_positions - 1;
              target_direction = 'right';
            } else {
              for (position_i = _i = cutoff_start; cutoff_start <= cutoff_end ? _i < cutoff_end : _i > cutoff_end; position_i = cutoff_start <= cutoff_end ? ++_i : --_i) {
                attributes = child_positions[position_i];
                if (attributes) {
                  current = parsed_children[position_i];
                  full_width = current.el.width();
                  half_width = full_width / 2;
                  full_height = current.el.height();
                  half_height = full_height / 2;
                  attributes_right = attributes.left + full_width;
                  attributes_bottom = attributes.top + full_height + full_height / 3;
                  offset_x = full_width / 3;
                  offset_y = full_height / 3;
                  if (attributes.top + offset_y < selected_y2 && attributes_bottom > selected_y2) {
                    if (attributes_right - offset_x > selected_x1 && attributes_right - offset_x < selected_x2) {
                      target_position = position_i;
                    }
                    if (!target_position) {
                      if (selected_x1 < 0 && attributes.left < full_width) {
                        target_position = position_i;
                        target_direction = 'left';
                      } else if (selected_x2 > globals.grid_width && attributes.right > selected_x1) {
                        target_position = position_i;
                        target_direction = 'right';
                      }
                    }
                  }
                }
              }
            }
            if (target_position) {
              $target = parsed_children[target_position].el;
              if (target_direction === 'left') {
                $selected.insertBefore($target);
              } else {
                $selected.insertAfter($target);
              }
            }
          } else {
            if (total_positions === 1) {
              attributes = child_positions[0];
              if (attributes.left < selected_x) {
                this.$container.append($selected);
              } else {
                this.$container.prepend($selected);
              }
            } else {
              this.$container.append($selected);
            }
          }
          this.arrange(true);
          if ($start_container[0] !== $selected.parent()[0]) {
            previous_container_class = options.previousContainerClass;
            return $("." + previous_container_class).trigger("ss-rearrange");
          }
        } else {
          placeholder_class = this.options.placeholderClass;
          return $("." + placeholder_class).remove();
        }
      };

      Plugin.prototype.enableResize = function() {
        var animation_speed, binding, resizing;
        animation_speed = this.options.animationSpeed;
        resizing = false;
        binding = "resize." + this.identifier;
        return $(window).on(binding, (function(_this) {
          return function() {
            if (!resizing) {
              resizing = true;
              setTimeout((function() {
                return _this.render();
              }), animation_speed / 3);
              setTimeout((function() {
                return _this.render();
              }), animation_speed / 3);
              return setTimeout(function() {
                resizing = false;
                return _this.render();
              }, animation_speed / 3);
            }
          };
        })(this));
      };

      Plugin.prototype.lowestCol = function(array, offset) {
        var augmented_array;
        if (offset == null) {
          offset = 0;
        }
        augmented_array = array.map(function(val, index) {
          return [val, index];
        });
        augmented_array.sort(function(a, b) {
          var ret;
          ret = a[0] - b[0];
          if (ret === 0) {
            ret = a[1] - b[1];
          }
          return ret;
        });
        return augmented_array[offset][1];
      };

      Plugin.prototype.highestCol = function(array) {
        return $.inArray(Math.max.apply(window, array), array);
      };

      Plugin.prototype.destroy = function() {
        var $active_children, $container, active_class, dragWhitelist;
        $container = this.$container;
        $container.off("ss-arrange");
        $container.off("ss-rearrange");
        $container.off("ss-setTargetPosition");
        $container.off("ss-destroy");
        active_class = this.options.activeClass;
        dragWhitelist = this.options.dragWhitelist;
        $active_children = $container.find("." + active_class).filter(dragWhitelist);
        if (this.options.enableDrag) {
          $active_children.draggable('destroy');
        }
        if (this.options.enableCrossDrop) {
          $container.droppable('destroy');
        }
        $active_children.removeClass(active_class);
        return $container.removeClass(this.identifier);
      };

      return Plugin;

    })();
    return $.fn[pluginName] = function(options) {
      return this.each(function() {
        var bound_indentifier, old_class, _ref;
        old_class = (_ref = $(this).attr("class").match(/shapeshifted_container_\w+/)) != null ? _ref[0] : void 0;
        if (old_class) {
          bound_indentifier = "resize." + old_class;
          $(window).off(bound_indentifier);
          $(this).removeClass(old_class);
        }
        return $.data(this, "plugin_" + pluginName, new Plugin(this, options));
      });
    };
  })(jQuery, window, document);

}).call(this);
