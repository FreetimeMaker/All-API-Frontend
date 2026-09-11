begin;

update public.luma_submissions set subcategory = null;
update public.store_apps set subcategory = null;
update public.store_apps set category_id = null;

delete from public.store_categories;

insert into public.store_categories (name, description, parent_id)
select category, 'F-Droid category', null
from unnest(array[
  'AI Chat','App Manager','App Store & Updater','Battery','Bookmark','Browser','Calculator','Calendar & Agenda','Clock','Cloud Storage & File Sync','Connectivity','Contact','Development','Diet','DNS & Hosts','Draw','Ebook Reader','Email','File Encryption & Vault','File Transfer','Firewall','Finance Manager','Flashlight','Forum','Gallery','Games','Graphics','Habit Tracker','Health Manager','Icon Pack','Internet','Inventory','Keyboard & IME','Launcher','Local Media Player','Location Tracker & Sharer','Messaging','Money','Multimedia','Music Practice Tool','Navigation','Network Analyzer','News','Note','Online Media Player','Pass Wallet','Password & 2FA','Phone & SMS','Podcast','Public Transport','Radio','Reading','Recipe Manager','Remote Control','Science & Education','Security','Shopping','Sports & Health','System','Task','Theming','Time','Translator','VPN & Proxy','Weather','Writing'
]::text[]) as category;

update public.luma_submissions
set category = case
  when name = 'GeoWeather' then 'Weather'
  when name = 'SuperSMP Companion' then 'Games'
  when category in (select name from public.store_categories) then category
  else 'System'
end,
subcategory = null;

update public.store_apps sa
set category_id = sc.id,
    subcategory = null
from public.luma_submissions ls
join public.store_categories sc on sc.name = ls.category
where sa.luma_submission_id = ls.id;

commit;
