select user_id,
  count(id) as orderCount
from nideshop_order
where user_id in (
    select id
    from nideshop_user
  )
group by user_id

select user_id, sum(total) from nideshop_invoice
where user_id in (select id from nideshop_user)
group by user_id

SELECT DATE_SUB(NOW(), INTERVAL 1 MONTH) / 1000

select user_id, sum(total) from nideshop_invoice
    where user_id in (select id from nideshop_user) 
    and date > UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 1 MONTH) )
    group by user_id

select user_id,
        count(id) as orderCount
      from nideshop_order
      where user_id in (
          1
        )
      group by user_id;