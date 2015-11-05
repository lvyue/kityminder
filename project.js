/**
 *
 * @param {Object} w window 对象
 * @param {Object} $ jQuery对象
 */
(function(w, $) {
	if (!Array.prototype.forEach) { // forEach hack
		Array.prototype.forEach = function(callback, thisArg) {
			var T, k;
			if (this == null) {
				throw new TypeError(" this is null or not defined");
			}
			var O = Object(this);
			var len = O.length >>> 0; // Hack to convert O.length to a UInt32  
			if ({}.toString.call(callback) != "[object Function]") {
				throw new TypeError(callback + " is not a function");
			}
			if (thisArg) {
				T = thisArg;
			}
			k = 0;
			while (k < len) {
				var kValue;
				if (k in O) {
					kValue = O[k];
					callback.call(T, kValue, k, O);
				}
				k++;
			}
		};
	}
	var doc = w.document;
	var Project = w.Project = {
		_id: undefined,
		_data: {},
		init: function(data) {
			var self = this;
			self._data = {}; // 1.初始化 _data 
			$('div#slide > div.left-menu > div').hide().removeClass('active'); // 2.隐藏所有的节点
			this.Tabs.forEach(function(tab) {
				if (data[tab.key]) {
					tab.value = data[tab.key];
					self._data[tab.key] = tab;
					$('div#slide > div.left-menu > div[data-type="' + tab.key + '"]').show();
				}
			});
			//显示评论
			$('div#slide > div.left-menu > div[data-type="comment"]').show();
		},
		select: function(e) {
			var _ = Project;
			var $this = $(this);
			$this.siblings().removeClass('active');
			$this.addClass('active');
			var _type = $this.attr('data-type');
			var _data = _._data[_type];
			var _area = [(doc.body.offsetWidth * 0.8) + 'px', (doc.body.offsetHeight * 0.8) + 'px'];
			var content = "";

			var _success = function() {};

			switch (_type) {
				case "desc":
				case "requirement":
				case "target":
					content = '<div class="res-box">' + _data.value + '</div>';
					layer.open({
						type: 1,
						title: _data.name,
						area: _area,
						skin: 'layui-layer-molv',
						content: content,
						shadeClose: true
					});
					break;
				case "photo":
					content = '<div class="res-box">' +
						'<div class="img-list">';
					// 拼接图片地址
					var imgs = _data.value;
					if (imgs && imgs.length > 0) {
						imgs.forEach(function(img) {
							content += '<img src="http://www.itgcs.com.cn/upload/' + img + '" />';
						});
					} else {
						content += "暂无";
					}
					content += '</div>' +
						'</div>';
					layer.open({
						type: 1,
						title: _data.name,
						area: _area,
						skin: 'layui-layer-molv',
						content: content,
						shadeClose: true
					});
					break;
				case "video":
					_area = (doc.body.offsetWidth * 0.8) + 'px';
					content = '<div class="res-box">';
					// 拼接视频数据地址
					var videos = _data.value;
					if (videos && videos.length > 0) {
						content += '<div class="video">'; //
						content += '<div class="video-area">'; // 视频播放区域
						content += '<video id="you-want-video" src="http://www.itgcs.com.cn/upload/' + (videos[0].url || "") + '" quality="high" width="100%" height="500" align="middle" allowscriptaccess="always" allowfullscreen="true" mode="transparent" controls="controls"></video>';
						content += '</div>';
						content += '<div class="video-list">'; // 视频列表区域
						videos.forEach(function(video, i) { // 生成右侧 视频列表
							var _name = video.name || "";
							content += '<a href="javascript:;" class="' + (i == 0 ? 'active' : '') + '" data-src="http://www.itgcs.com.cn/upload/' + video.url + '"  title="' + _name + '">' + (_name.substring(0, _name.indexOf(".mp4"))) + '</a>';
						});
						content += '</div>';
						content += '<div class="clearfix"></div>';
						content += '</div>';
						_success = function(layero, index) {
							$(layero).find('div.video-list').off('click', 'a').on('click', 'a', _.videoChange);
						};
					} else {
						_area = "auto";
						content += '<div style="text-align:center;">暂无视频</div>';
					}
					content += '</div>';
					layer.open({
						type: 1,
						title: _data.name,
						area: _area,
						skin: 'layui-layer-molv',
						content: content,
						shadeClose: true,
						success: _success
					});
					break;
				case "comment":
					var _status = $this.attr('data-status') || "0";
					if (_status === "0") {
						$('div#slide').css("right", "0");
						$this.attr('data-status', "1");
					} else {
						$('div#slide').css("right", "-270px");
						$this.attr('data-status', "0");
					}
					break;
			}
		},
		videoChange: function() {
			$('video#you-want-video').attr('src', $(this).attr('data-src'));
			$(this).siblings().removeClass('active');
			$(this).addClass('active');
		}
	};
	// Tab标签
	Object.defineProperty(Project, "Tabs", {
		"configurable": false,
		"value": [{
			"key": "name",
			"name": "名称",
			"value": null
		}, {
			"key": "requirement",
			"name": "要求",
			"value": null
		}, {
			"key": "desc",
			"name": "描述",
			"value": null
		}, {
			"key": "target",
			"name": "目标",
			"value": null
		}, {
			"key": "attch",
			"name": "资源",
			"value": null
		}, {
			"key": "video",
			"name": "视频",
			"value": null
		}, {
			"key": "docs",
			"name": "文档",
			"value": null
		}, {
			"key": "photo",
			"name": "效果图",
			"value": null
		}]
	});

	// 分类类型
	Object.defineProperty(Project, "Category", {
		"configurable": false,
		"value": {
			BLOCK: 0, // 功能块
			KNOWLEDGE: 1, // 知识点
			CHAPTER: 2 // 章节
		}
	});
	// 事件绑定
	$(function() {
		//选中事件
		$('div#slide > div.left-menu').off('click', 'div', Project.select).on('click', 'div', Project.select);
	});
})(window, jQuery || window.jQuery);