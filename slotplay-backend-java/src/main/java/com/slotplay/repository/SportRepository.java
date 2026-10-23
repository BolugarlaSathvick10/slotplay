package com.slotplay.repository;

import com.slotplay.entity.Sport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SportRepository extends JpaRepository<Sport, Integer> {

    List<Sport> findAllByOrderByNameAsc();

    Optional<Sport> findByName(String name);
}
