enum HikEventDirection { breakIn, breakOut, unknown }

class HikEvent {
  final String cardNo;
  final String? employeeNo;
  final DateTime dateTime;
  final int serialNo;
  final int? subEventType;
  final String? hikType;
  // DS-K attendance terminal field: "checkIn" "checkOut" "breakIn" "breakOut" etc.
  final String? attendanceStatus;

  HikEvent({
    required this.cardNo,
    this.employeeNo,
    required this.dateTime,
    required this.serialNo,
    this.subEventType,
    this.hikType,
    this.attendanceStatus,
  });

  HikEventDirection get direction {
    final s = attendanceStatus?.toLowerCase();
    if (s == 'breakin' || s == 'checkin' || s == 'overtimein') {
      return HikEventDirection.breakIn;
    }
    if (s == 'breakout' || s == 'checkout' || s == 'overtimeout') {
      return HikEventDirection.breakOut;
    }
    // Fallback for other device models
    final t = hikType?.toLowerCase();
    if (t == 'breakout' || subEventType == 75) return HikEventDirection.breakOut;
    if (t == 'breakin' || subEventType == 76) return HikEventDirection.breakIn;
    return HikEventDirection.unknown;
  }

  @override
  String toString() =>
      'HikEvent(card=$cardNo, serial=$serialNo, time=$dateTime, dir=$direction)';
}

class DeviceInfo {
  final String deviceName;
  final String model;
  final String serialNumber;
  final String firmwareVersion;

  DeviceInfo({
    required this.deviceName,
    required this.model,
    required this.serialNumber,
    required this.firmwareVersion,
  });

  @override
  String toString() => '$deviceName ($model)';
}
