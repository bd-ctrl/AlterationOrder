/**
 * SUITCUBE — Salesforce Lookup Proxy (Google Apps Script)
 * -----------------------------------------------------------------
 * หน้าที่: รับเบอร์โทรจาก frontend (GitHub Pages) -> ขอ token จาก
 * Salesforce (client_credentials) -> query Contact -> ส่งผลลัพธ์กลับ
 * เป็น JSON โดยที่ client_id / client_secret ไม่หลุดไปฝั่ง browser เลย
 *
 * ก่อนใช้งาน ตั้งค่า Script Properties 4 ตัว (Project Settings รูปเฟือง
 * ด้านซ้าย > Script Properties > Add script property):
 *   SF_CLIENT_ID      = 3MVG9YDQS5WtC11pB2NJrss_wGzlLzacFAXJS9itFBF6c5GLBrhSBCA8m2Np1O03fHzzrS4gIdQ5ApMmm3JhT
 *   SF_CLIENT_SECRET  = 707AA58A53E9064059957DFE01622B7E0E155987A4C612715C16D49B6612EF8C
 *   SF_TOKEN_URL      = https://d6f000002yqrnuao.my.salesforce.com/services/oauth2/token
 *   SF_API_VERSION    = v59.0
 *
 * ห้าม hardcode ค่าพวกนี้ลงในโค้ดตรงๆ — ใส่ผ่าน Script Properties เท่านั้น
 * (โค้ดใน Apps Script ไม่ถูกส่งไปที่ browser อยู่แล้ว แต่แยกไว้ใน
 * Properties จะสลับ/หมุน secret ทีหลังได้โดยไม่ต้องแก้โค้ด)
 */

function doGet(e) {
  try {
    const phone = ((e.parameter.phone || '') + '').replace(/[^0-9]/g, '');
    if (phone.length < 10) {
      return jsonResponse_({ error: 'invalid_phone', message: 'กรอกเบอร์โทรไม่ครบ 10 หลัก' });
    }

    const token = getSalesforceToken_();
    const variants = phoneVariants_(phone);
    const inClause = variants.map(v => "'" + v.replace(/'/g, "\\'") + "'").join(', ');

    const soql =
      'SELECT Id, Name, Nickname1__c, Email, MobilePhone, Phone, Field1__c, Salutation ' +
      'FROM Contact ' +
      'WHERE MobilePhone IN (' + inClause + ') OR Phone IN (' + inClause + ') ' +
      'ORDER BY LastModifiedDate DESC LIMIT 1';

    const apiVersion = PropertiesService.getScriptProperties().getProperty('SF_API_VERSION') || 'v59.0';
    const url = token.instanceUrl + '/services/data/' + apiVersion + '/query?q=' + encodeURIComponent(soql);

    const res = UrlFetchApp.fetch(url, {
      headers: { Authorization: 'Bearer ' + token.accessToken },
      muteHttpExceptions: true
    });

    const status = res.getResponseCode();
    if (status !== 200) {
      // ส่ง raw error จาก Salesforce กลับมาด้วย จะได้เห็นสาเหตุจริงตอน debug
      return jsonResponse_({ error: 'query_failed', status: status, detail: res.getContentText() });
    }

    const data = JSON.parse(res.getContentText());
    if (!data.records || !data.records.length) {
      return jsonResponse_({ found: false });
    }

    const r = data.records[0];
    return jsonResponse_({
      found: true,
      name: r.Name || '',
      nickname: r.Nickname1__c || '',
      email: r.Email || '',
      gender: r.Field1__c || r.Salutation || ''
    });

  } catch (err) {
    return jsonResponse_({ error: 'exception', message: String(err) });
  }
}

function getSalesforceToken_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('sf_token');
  if (cached) return JSON.parse(cached);

  const props = PropertiesService.getScriptProperties();
  const res = UrlFetchApp.fetch(props.getProperty('SF_TOKEN_URL'), {
    method: 'post',
    payload: {
      grant_type: 'client_credentials',
      client_id: props.getProperty('SF_CLIENT_ID'),
      client_secret: props.getProperty('SF_CLIENT_SECRET')
    },
    muteHttpExceptions: true
  });

  if (res.getResponseCode() !== 200) {
    throw new Error('Auth failed (' + res.getResponseCode() + '): ' + res.getContentText());
  }

  const data = JSON.parse(res.getContentText());
  const token = { accessToken: data.access_token, instanceUrl: data.instance_url };
  cache.put('sf_token', JSON.stringify(token), 1800); // cache token ไว้ 30 นาที ลดจำนวนครั้งที่ขอ token ใหม่
  return token;
}

function phoneVariants_(d) {
  const v = {};
  v[d] = true;
  if (d.charAt(0) === '0' && d.length === 10) {
    v['+66' + d.slice(1)] = true;
    v['66' + d.slice(1)] = true;
    v[d.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')] = true;
  }
  return Object.keys(v);
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
