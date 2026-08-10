use std::collections::HashMap;

const PAGE_SIZE: usize = 4096;
const PAGE_HEADER_SIZE: usize = 25;
const HEADER_MAGIC: &[u8] = b"** This is a LiteDB file **";
const HEADER_MAGIC_LEN: usize = 27;
const SUPPORTED_FILE_VERSION: u8 = 7;

#[derive(Debug, Clone, PartialEq)]
pub enum LiteValue {
    Null,
    Boolean(bool),
    Int32(i32),
    Int64(i64),
    Double(f64),
    Decimal(f64),
    String(String),
    Document(LiteDocument),
    Array(Vec<LiteValue>),
    Binary(Vec<u8>),
    Guid([u8; 16]),
    ObjectId([u8; 12]),
    DateTime(i64),
    MinValue,
    MaxValue,
}

pub type LiteDocument = HashMap<String, LiteValue>;

impl LiteValue {
    pub fn as_str(&self) -> Option<&str> {
        match self {
            LiteValue::String(s) => Some(s),
            _ => None,
        }
    }

    pub fn as_bool(&self) -> Option<bool> {
        match self {
            LiteValue::Boolean(b) => Some(*b),
            _ => None,
        }
    }

    pub fn as_i64(&self) -> Option<i64> {
        match self {
            LiteValue::Int64(v) => Some(*v),
            LiteValue::Int32(v) => Some(*v as i64),
            LiteValue::Double(v) => Some(*v as i64),
            _ => None,
        }
    }

    pub fn as_datetime_ms(&self) -> Option<i64> {
        match self {
            LiteValue::DateTime(ms) => Some(*ms),
            _ => None,
        }
    }

    pub fn as_array(&self) -> Option<&Vec<LiteValue>> {
        match self {
            LiteValue::Array(a) => Some(a),
            _ => None,
        }
    }

    pub fn as_document(&self) -> Option<&LiteDocument> {
        match self {
            LiteValue::Document(d) => Some(d),
            _ => None,
        }
    }

    pub fn guid_key(&self) -> Option<String> {
        match self {
            LiteValue::Guid(b) => Some(hex_of(b)),
            LiteValue::Binary(b) if b.len() == 16 => Some(hex_of(b)),
            _ => None,
        }
    }
}

fn hex_of(bytes: &[u8]) -> String {
    let mut s = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        s.push_str(&format!("{:02x}", b));
    }
    s
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct PageAddress {
    page_id: u32,
    index: u16,
}

impl PageAddress {
    const EMPTY: PageAddress = PageAddress {
        page_id: u32::MAX,
        index: u16::MAX,
    };

    fn is_empty(&self) -> bool {
        self.page_id == u32::MAX
    }
}

#[derive(Clone, Copy)]
struct IndexNodeLite {
    next0: PageAddress,
    datablock: PageAddress,
}

struct ByteReader<'a> {
    buf: &'a [u8],
    pos: usize,
}

impl<'a> ByteReader<'a> {
    fn new(buf: &'a [u8]) -> Self {
        Self { buf, pos: 0 }
    }

    fn remaining(&self) -> usize {
        self.buf.len().saturating_sub(self.pos)
    }

    fn skip(&mut self, n: usize) {
        self.pos += n;
    }

    fn take_fixed<const N: usize>(&mut self) -> [u8; N] {
        let mut out = [0u8; N];
        let avail = self.remaining().min(N);
        if avail > 0 {
            out[..avail].copy_from_slice(&self.buf[self.pos..self.pos + avail]);
        }
        self.pos += N;
        out
    }

    fn read_u8(&mut self) -> u8 {
        self.take_fixed::<1>()[0]
    }

    fn read_bool(&mut self) -> bool {
        self.read_u8() != 0
    }

    fn read_u16(&mut self) -> u16 {
        u16::from_le_bytes(self.take_fixed())
    }

    fn read_u32(&mut self) -> u32 {
        u32::from_le_bytes(self.take_fixed())
    }

    fn read_i32(&mut self) -> i32 {
        i32::from_le_bytes(self.take_fixed())
    }

    fn read_i64(&mut self) -> i64 {
        i64::from_le_bytes(self.take_fixed())
    }

    fn read_f64(&mut self) -> f64 {
        f64::from_le_bytes(self.take_fixed())
    }

    fn read_decimal(&mut self) -> f64 {
        let lo = self.read_i32() as u32 as u128;
        let mid = self.read_i32() as u32 as u128;
        let hi = self.read_i32() as u32 as u128;
        let flags = self.read_i32();
        let sign = if (flags >> 31) & 1 == 1 { -1.0 } else { 1.0 };
        let scale = ((flags >> 16) & 0xFF) as i32;
        let mantissa = lo | (mid << 32) | (hi << 64);
        sign * (mantissa as f64) / 10f64.powi(scale)
    }

    fn read_bytes(&mut self, n: usize) -> Vec<u8> {
        let avail = self.remaining().min(n);
        let v = self.buf[self.pos..self.pos + avail].to_vec();
        self.pos += n;
        v
    }

    fn read_string_len(&mut self, len: usize) -> String {
        let bytes = self.read_bytes(len);
        String::from_utf8_lossy(&bytes).into_owned()
    }

    fn read_lstring(&mut self) -> String {
        let len = self.read_i32().max(0) as usize;
        self.read_string_len(len)
    }

    fn read_guid(&mut self) -> [u8; 16] {
        self.take_fixed()
    }

    fn read_object_id(&mut self) -> [u8; 12] {
        self.take_fixed()
    }

    fn read_page_address(&mut self) -> PageAddress {
        PageAddress {
            page_id: self.read_u32(),
            index: self.read_u16(),
        }
    }

    fn read_cstring(&mut self) -> String {
        let mut buf = Vec::new();
        loop {
            if self.remaining() == 0 {
                break;
            }
            let b = self.read_u8();
            if b == 0 {
                break;
            }
            buf.push(b);
            if buf.len() >= 4096 {
                break;
            }
        }
        String::from_utf8_lossy(&buf).into_owned()
    }

    fn read_index_key(&mut self, length: u16) -> LiteValue {
        let t = self.read_u8();
        match t {
            0 => LiteValue::MinValue,
            1 => LiteValue::Null,
            2 => LiteValue::Int32(self.read_i32()),
            3 => LiteValue::Int64(self.read_i64()),
            4 => LiteValue::Double(self.read_f64()),
            5 => LiteValue::Decimal(self.read_decimal()),
            6 => LiteValue::String(self.read_string_len(length as usize)),
            7 => LiteValue::Document(read_bson_document(self)),
            8 => LiteValue::Array(read_bson_array(self)),
            9 => LiteValue::Binary(self.read_bytes(length as usize)),
            10 => LiteValue::ObjectId(self.read_object_id()),
            11 => LiteValue::Guid(self.read_guid()),
            12 => LiteValue::Boolean(self.read_bool()),
            13 => LiteValue::DateTime(self.read_i64()),
            14 => LiteValue::MaxValue,
            _ => LiteValue::Null,
        }
    }
}

fn read_bson_element(r: &mut ByteReader) -> (String, LiteValue) {
    let t = r.read_u8();
    let name = r.read_cstring();
    let value = match t {
        0x01 => LiteValue::Double(r.read_f64()),
        0x02 => {
            let len = r.read_i32().max(1) as usize;
            let bytes = r.read_bytes(len.saturating_sub(1));
            r.read_u8(); // trailing \0
            LiteValue::String(String::from_utf8_lossy(&bytes).into_owned())
        }
        0x03 => LiteValue::Document(read_bson_document(r)),
        0x04 => LiteValue::Array(read_bson_array(r)),
        0x05 => {
            let len = r.read_i32().max(0) as usize;
            let subtype = r.read_u8();
            let bytes = r.read_bytes(len);
            match subtype {
                0x04 => {
                    let mut g = [0u8; 16];
                    if bytes.len() == 16 {
                        g.copy_from_slice(&bytes);
                    }
                    LiteValue::Guid(g)
                }
                _ => LiteValue::Binary(bytes),
            }
        }
        0x07 => LiteValue::ObjectId(r.read_object_id()),
        0x08 => LiteValue::Boolean(r.read_bool()),
        0x09 => LiteValue::DateTime(r.read_i64()),
        0x0A => LiteValue::Null,
        0x10 => LiteValue::Int32(r.read_i32()),
        0x12 => LiteValue::Int64(r.read_i64()),
        0x13 => LiteValue::Decimal(r.read_decimal()),
        0xFF => LiteValue::MinValue,
        0x7F => LiteValue::MaxValue,
        _ => LiteValue::Null,
    };
    (name, value)
}

fn read_bson_document(r: &mut ByteReader) -> LiteDocument {
    let length = r.read_i32().max(5) as usize;
    let end = (r.pos + length).saturating_sub(5).min(r.buf.len());
    let mut map = LiteDocument::new();
    while r.pos < end && r.remaining() > 0 {
        let (name, value) = read_bson_element(r);
        map.insert(name, value);
    }
    r.read_u8();
    map
}

fn read_bson_array(r: &mut ByteReader) -> Vec<LiteValue> {
    let length = r.read_i32().max(5) as usize;
    let end = (r.pos + length).saturating_sub(5).min(r.buf.len());
    let mut arr = Vec::new();
    while r.pos < end && r.remaining() > 0 {
        let (_name, value) = read_bson_element(r);
        arr.push(value);
    }
    r.read_u8();
    arr
}

fn read_page_bytes(data: &[u8], page_id: u32) -> Result<&[u8], String> {
    let off = (page_id as u64) * (PAGE_SIZE as u64);
    let off = off as usize;
    if off + PAGE_SIZE > data.len() {
        return Err(format!("page {} is out of file bounds", page_id));
    }
    Ok(&data[off..off + PAGE_SIZE])
}

fn validate_header(data: &[u8]) -> Result<(), String> {
    if data.len() < PAGE_SIZE {
        return Err("File is too small to be a valid LiteDB database".to_string());
    }
    let magic = &data[PAGE_HEADER_SIZE..PAGE_HEADER_SIZE + HEADER_MAGIC_LEN];
    if !magic.starts_with(HEADER_MAGIC) {
        return Err("Not a valid LiteDB file (missing signature)".to_string());
    }
    let version = data[PAGE_HEADER_SIZE + HEADER_MAGIC_LEN];
    if version != SUPPORTED_FILE_VERSION {
        return Err(format!(
            "Unsupported LiteDB file version {} (this importer only supports the LiteDB v4.x format used by Playnite)",
            version
        ));
    }
    Ok(())
}

fn read_header_collections(data: &[u8]) -> Result<HashMap<String, u32>, String> {
    let page = read_page_bytes(data, 0)?;
    let mut r = ByteReader::new(page);
    r.skip(PAGE_HEADER_SIZE);
    r.skip(HEADER_MAGIC_LEN); // HEADER_INFO
    r.skip(1); // file version byte
    r.skip(2); // ChangeID (u16)
    r.skip(4); // FreeEmptyPageID (u32)
    r.skip(4); // LastPageID (u32)
    r.skip(2); // UserVersion (u16)
    r.skip(20); // Password
    r.skip(16); // Salt

    let cols_count = r.read_u8();
    let mut map = HashMap::new();
    for _ in 0..cols_count {
        let name = r.read_lstring();
        let page_id = r.read_u32();
        map.insert(name, page_id);
    }
    Ok(map)
}

fn read_collection_pk_head_tail(data: &[u8], page_id: u32) -> Result<(PageAddress, PageAddress), String> {
    let page = read_page_bytes(data, page_id)?;
    let mut r = ByteReader::new(page);
    r.skip(PAGE_HEADER_SIZE);
    let _name = r.read_lstring();
    let _doc_count = r.read_i64();
    let _free_data_page_id: u32 = r.read_u32();
    let _field = r.read_lstring();
    let _unique = r.read_bool();
    let head = r.read_page_address();
    let tail = r.read_page_address();
    Ok((head, tail))
}

fn parse_index_page(data: &[u8], page_id: u32) -> Result<HashMap<u16, IndexNodeLite>, String> {
    let page = read_page_bytes(data, page_id)?;
    let mut r = ByteReader::new(page);
    r.skip(5); // PageID + PageType, already known by caller
    let _prev = r.read_u32();
    let _next = r.read_u32();
    let item_count = r.read_u16();
    let _free_bytes = r.read_u16();
    r.skip(8); // reserved

    let mut nodes = HashMap::new();
    for _ in 0..item_count {
        let index = r.read_u16();
        let levels = r.read_u8();
        let _slot = r.read_u8();
        let _prev_node = r.read_page_address();
        let _next_node = r.read_page_address();
        let key_length = r.read_u16();
        let _key = r.read_index_key(key_length);
        let datablock = r.read_page_address();

        let mut next0 = PageAddress::EMPTY;
        for level in 0..levels {
            let _prev_l = r.read_page_address();
            let next_l = r.read_page_address();
            if level == 0 {
                next0 = next_l;
            }
        }

        nodes.insert(index, IndexNodeLite { next0, datablock });
    }
    Ok(nodes)
}

fn get_node(
    data: &[u8],
    cache: &mut HashMap<u32, HashMap<u16, IndexNodeLite>>,
    addr: PageAddress,
) -> Option<IndexNodeLite> {
    if addr.is_empty() {
        return None;
    }
    if !cache.contains_key(&addr.page_id) {
        let parsed = parse_index_page(data, addr.page_id).ok()?;
        cache.insert(addr.page_id, parsed);
    }
    cache.get(&addr.page_id)?.get(&addr.index).copied()
}

fn enumerate_pk_datablocks(data: &[u8], head: PageAddress, tail: PageAddress) -> Vec<PageAddress> {
    let mut cache: HashMap<u32, HashMap<u16, IndexNodeLite>> = HashMap::new();
    let mut result = Vec::new();
    let mut current = head;
    let mut guard = 0usize;

    loop {
        guard += 1;
        if guard > 5_000_000 {
            break;
        }
        let node = match get_node(data, &mut cache, current) {
            Some(n) => n,
            None => break,
        };
        let next = node.next0;
        if next.is_empty() || next == tail {
            break;
        }
        let next_node = match get_node(data, &mut cache, next) {
            Some(n) => n,
            None => break,
        };
        result.push(next_node.datablock);
        current = next;
    }
    result
}

fn read_extend_chain(data: &[u8], mut page_id: u32) -> Vec<u8> {
    let mut out = Vec::new();
    let mut guard = 0usize;
    loop {
        guard += 1;
        if guard > 1_000_000 {
            break;
        }
        let page = match read_page_bytes(data, page_id) {
            Ok(p) => p,
            Err(_) => break,
        };
        let mut r = ByteReader::new(page);
        r.skip(5);
        let _prev = r.read_u32();
        let next = r.read_u32();
        let item_count = r.read_u16();
        let _free_bytes = r.read_u16();
        r.skip(8);
        let chunk = r.read_bytes(item_count as usize);
        out.extend_from_slice(&chunk);
        if next == u32::MAX {
            break;
        }
        page_id = next;
    }
    out
}

fn read_document_bytes(data: &[u8], addr: PageAddress) -> Option<Vec<u8>> {
    let page = read_page_bytes(data, addr.page_id).ok()?;
    let mut r = ByteReader::new(page);
    r.skip(5);
    let _prev = r.read_u32();
    let _next = r.read_u32();
    let item_count = r.read_u16();
    let _free_bytes = r.read_u16();
    r.skip(8);

    for _ in 0..item_count {
        let idx = r.read_u16();
        let extend_page_id = r.read_u32();
        let size = r.read_u16();
        if idx == addr.index {
            if extend_page_id != u32::MAX {
                return Some(read_extend_chain(data, extend_page_id));
            }
            return Some(r.read_bytes(size as usize));
        } else {
            r.skip(size as usize);
        }
    }
    None
}

pub fn read_all_documents(data: &[u8]) -> Result<Vec<LiteDocument>, String> {
    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| -> Result<Vec<LiteDocument>, String> {
        validate_header(data)?;
        let collections = read_header_collections(data)?;
        let mut docs = Vec::new();
        for page_id in collections.values() {
            let (head, tail) = match read_collection_pk_head_tail(data, *page_id) {
                Ok(v) => v,
                Err(_) => continue,
            };
            let addrs = enumerate_pk_datablocks(data, head, tail);
            for addr in addrs {
                if let Some(raw) = read_document_bytes(data, addr) {
                    let mut r = ByteReader::new(&raw);
                    docs.push(read_bson_document(&mut r));
                }
            }
        }
        Ok(docs)
    }));

    match result {
        Ok(inner) => inner,
        Err(_) => Err("Internal error while parsing LiteDB file (corrupt or unsupported data)".to_string()),
    }
}
