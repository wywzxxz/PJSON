/*
1.网络级别的引用关系
2.prototype
3.seter/getter
*/
var PJSON;
{
	PJSON=
	{
		token:"__PJSON__"
		,clone:function(a){return PJSON.parse(	PJSON.stringify(a)	);}
		,proto:[
			"Function.prototype",
			"Object.prototype",
			"Number.prototype",
			"Boolean.prototype",
			"String.prototype",
			"Array.prototype",
			"RegExp.prototype",
			"Error.prototype",
			"Date.prototype",
			"Object.prototype"
		]
		,stringify:function(root)
		{
			//mark dependence
			var a=JSON.stringify(travel(root,[]));
			//clean markers
			clean(root);
			return a;

			function dealprototype(obj,json,cur)
			{
				var pr=Object.getPrototypeOf(obj);
				for (var i=0;i<PJSON.proto.length;++i)
					if (pr==eval(PJSON.proto[i]))
					{
						json["prototype"]=PJSON.proto[i];
						return;
					}
				cur.push("__proto__");
				json["prototype"]=travel(pr,cur);
				cur.pop();
			}
			function travel(obj,cur)
			{
				var json;
				if (typeof obj=="undefined") return;
				if (obj[PJSON.token] && (!obj.__proto__ || obj[PJSON.token]!=obj.__proto__[PJSON.token]	) )
				{
					json={};json[PJSON.token]="link";
					json["cur"]=JSON.parse(JSON.stringify(obj[PJSON.token]));
					return json;
				}
				cur=JSON.parse(JSON.stringify(cur));
				var c=typeof obj;if (obj instanceof Array) c="Array";
				switch (c)
				{
					default:
						throw "ERROR non-orginaized type"+typeof obj
					break;case "undefined":
					break;case "number":
						json=obj;
					break;case "boolean":
						json=obj;
					break;case "string":
						json=obj;
					break;case "function":
						json={};json[PJSON.token]="function";
						json["function"]=""+obj;

						dealprototype(obj,json,cur);
						obj[PJSON.token]=JSON.parse(JSON.stringify(cur));
					break;case "Array":
						json={};json[PJSON.token]="array";
						json["length"]=obj.length;
						json["array"]={};

						dealprototype(obj,json,cur);
						obj[PJSON.token]=JSON.parse(JSON.stringify(cur));
						var key=Object.keys(obj);
						for (var i=0;i<key.length;++i) if (key[i]!=PJSON.token && key[i]!="length")
						{
							cur.push(key[i]);
							json["array"][key[i]]=travel(obj[key[i]],cur);
							cur.pop();
						}
					break;case "object":
						json={};
						json[PJSON.token]="object";
						json["object"]={}
						json["getter"]={}
						json["setter"]={}


						obj[PJSON.token]=JSON.parse(JSON.stringify(cur));
						dealprototype(obj,json,cur);
						var key=Object.keys(obj);
						for (var i=0;i<key.length;++i) if (key[i]!=PJSON.token)
						{
							var g = obj.__lookupGetter__(key[i]);
							var s = obj.__lookupSetter__(key[i]);
							if (g || s)
							{
								function deal(g){g=""+g;return "function "+g.substring(g.indexOf("("));}
								if (g)	json["getter"][key[i]]=deal(g);
								if (s)	json["setter"][key[i]]=deal(s);
							}else {
								cur.push(key[i]);
								json["object"][key[i]]=travel(obj[key[i]],cur);
								cur.pop();
							}
						}
				}
				return json;
			}
			function clean(obj)
			{
				var c=typeof obj;if (obj instanceof Array) c="Array";
				switch (c)
				{
					default:
						throw "ERROR non-orginaized type"+typeof obj
					break;case "undefined":
					break;case "number":
					break;case "boolean":
					break;case "string":
					break;case "function":
						delete obj[PJSON.token];
					break;case "Array":
						delete obj[PJSON.token];
						for (var i in obj) if (i!=PJSON.token && i!="length")//for (var i=0;i<obj.length;++i) if (typeof obj[i]!="undefined")
						{
							clean(obj[i]);
						}
					break;case "object":
						delete obj[PJSON.token];
						//clean(Object.getPrototypeOf(obj));
						for (var i in obj)
						{
							var g = obj.__lookupGetter__(i);
							var s = obj.__lookupSetter__(i);
							if (g || s) continue;
							if (typeof obj[i]!="undefined" && i!=PJSON.token)	clean(obj[i]);
						}
				}
			}
		}
		,parse:function(root)
		{
			var root=JSON.parse(root);
			var jsonroot;
			return travel(root);
			function travel(obj)
			{
				var json;
				var c=typeof obj;if (obj instanceof Array) c="Array";
				switch (c)
				{
					default:
						throw "ERROR non-orginaized type"+typeof obj
					break;case "undefined":
					break;case "number":
						json=obj;
						if (!jsonroot) jsonroot=json;
					break;case "boolean":
						json=obj;
						if (!jsonroot) jsonroot=json;
					break;case "string":
						json=obj;
						if (!jsonroot) jsonroot=json;
					//break;case "function":
					//break;case "array":
					break;case "object":
						switch (obj[PJSON.token])
						{
							default:
								throw "ERROR non-orginaized token "+obj[PJSON.token]
							break;case "function":
								json=eval("("+obj.function+")");
							break;case "array":
								json=[];if (!jsonroot) jsonroot=json;
								json.length=obj.length;
								for (var i in obj.array)
								json[i]=travel(obj.array[i]);
							break;case "object":
								json={};if (!jsonroot) jsonroot=json;
								if (obj["prototype"])
								{
									if (typeof obj["prototype"]=="string")
										Object.setPrototypeOf(json,eval(obj["prototype"]));
									else
										Object.setPrototypeOf(json,travel(obj["prototype"]));
								}
								for (var i in obj.getter)	json.__defineGetter__(i,eval("("+obj.getter[i]+")"));
								for (var i in obj.setter)	json.__defineSetter__(i,eval("("+obj.setter[i]+")"));
								for (var i in obj.object)
									json[i]=travel(obj.object[i]);
							break;case "link":
								json=jsonroot;
								for (var i=0;i<obj.cur.length;++i)
									if (obj.cur[i]=="__proto")
										json=Object.getPrototypeOf(json);
									else
										json=json[obj.cur[i]];
						}
				}
				return json;
			}
		}
		,extend:function(obj,more)
		{
			function pro(obj)
			{
				var pr=Object.getPrototypeOf(obj);
				for (var i=0;i<PJSON.proto.length;++i)
					if (pr==eval(PJSON.proto[i]))	return false;
				return true;
			}
			//prototype
			if (pro(obj))
			{
				if (pro(more)) {
					PJSON.extend(obj.__proto__,more.__proto__);
				}
				else obj.__proto__=more.__proto__;
			}
			//属性值
			var arr=Object.keys(more);
			for (var i=0;i<arr.length;++i)
			{
				var g = more.__lookupGetter__(arr[i]);
				var s = more.__lookupSetter__(arr[i]);
				if (g || s)
				{
					delete obj[i];
					if (g) obj.__defineGetter__(arr[i],g);
					if (s) obj.__defineSetter__(arr[i],s);
					continue;
				}
				switch(typeof more[arr[i]])
				{
					default:
						throw "ERROR non-orginaized type"+typeof obj
					break;case "undefined":
					break;case "number":case "boolean":case "string":case "function":
						obj[arr[i]]=more[arr[i]];
					break;case "Array":case "object":
						var g = obj.__lookupGetter__(arr[i]);
						var s = obj.__lookupSetter__(arr[i]);
						if (g || s)	delete obj[arr[i]];
						if (typeof obj[arr[i]]=="object") PJSON.extend(obj[arr[i]],more[arr[i]]);
						else
							obj[arr[i]]=more[arr[i]]
				}
			}
			return obj;
		}
	}
}
if (module)
	module.exports=PJSON;
