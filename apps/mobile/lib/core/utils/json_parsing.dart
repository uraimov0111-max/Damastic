DateTime? parseDateTime(dynamic value) {
  if (value == null) {
    return null;
  }

  return DateTime.tryParse(value.toString());
}

double parseDouble(dynamic value, [double fallback = 0]) {
  if (value is num) {
    return value.toDouble();
  }

  return double.tryParse(value?.toString() ?? '') ?? fallback;
}

int parseInt(dynamic value, [int fallback = 0]) {
  if (value is int) {
    return value;
  }

  if (value is num) {
    return value.toInt();
  }

  return int.tryParse(value?.toString() ?? '') ?? fallback;
}

String parseString(dynamic value, [String fallback = '']) {
  if (value == null) {
    return fallback;
  }

  return value.toString();
}

Map<String, dynamic> ensureMap(dynamic value) {
  if (value is Map<String, dynamic>) {
    return value;
  }

  if (value is Map) {
    return value.map((key, data) => MapEntry(key.toString(), data));
  }

  return <String, dynamic>{};
}

List<Map<String, dynamic>> ensureList(dynamic value) {
  if (value is! List) {
    return const <Map<String, dynamic>>[];
  }

  return value.map(ensureMap).toList(growable: false);
}
